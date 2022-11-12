import { Notice, parseYaml, stringifyYaml, TFile, type App, type CachedMetadata, type FrontMatterCache } from "obsidian";
import { xlink_attr } from "svelte/internal";
import vCard from "vcf";

export class Person{
    file: TFile;
    name: string;
    birthday: Date;
    age: Number;
    mother: string;
    father: string;
    children: string[];
    street: string;
    postCode: Number;
    city: string;
    country: string;
    phone: string;
    email: string;
    url: string;

    get birthdayString(): string{
        return this.birthday.toISOString().substring(0, 10);
    }

    get address(): string{
        const city = [this.postCode, this.city].filter(x => x).join(" ");
        return [this.street, city, this.country].filter(x => x).join("<br>");
    }

    constructor(readonly app: App) {
    }

    public static fromFile(file: TFile | null, app: App): Person | null {
        if (!file){
            return null;
        }
        let person = new Person(app);

        person.file = file;
        const frontMatter = person.getFrontMatter();
        person.updateFrontmatter(frontMatter);
        
        person.name = file.basename;
        person.birthday = new Date(Date.parse(frontMatter.birthday));
        person.age = calculateAge(person.birthday);
        person.father = frontMatter.father?.[0]?.[0];
        person.mother = frontMatter.mother?.[0]?.[0];
        person.children = getChildren(file, app).map(x => x.basename);

        person.street = frontMatter.street;
        person.postCode = frontMatter["post-code"];
        person.city = frontMatter.city;
        person.country = frontMatter.country;
        person.phone = frontMatter.phone;
        person.email = frontMatter.email;
        person.url = frontMatter.url;

        return person;
    }

    public static fromName(name: string, app: App): Person {
        const file = app.vault.getAbstractFileByPath(`People/${name}.md`);
        if (file instanceof TFile) {
            return this.fromFile(file, app) ?? new Person(app);
        }
        return new Person(app);
    }

    private getFrontMatter(): Omit<FrontMatterCache, "position"> {
        if (this.file){
            const meta = app.metadataCache.getFileCache(this.file);
            if (meta?.frontmatter){
                const { position, ...frontMatter }: FrontMatterCache = meta?.frontmatter;
                return frontMatter;
            }
        }

        return {};
    }

    public importVCard(card: vCard){
        this.name = card.data.fn.valueOf() as string;
        this.birthday = perseBirthday(card.data.bday.valueOf() as string);
        this.street = parsePhone(card.data.tel);
        this.phone = parsePhone(card.data.tel);
        this.email = card.data.email.valueOf() as string;
        [this.street, this.city, this.postCode, this.country] = parseAddress(card.data.adr);
    }

    public async save() {
        let frontMatter = this.getFrontMatter();
        frontMatter.birthday = this.birthdayString;
        frontMatter.father = this.father;
        frontMatter.mother = this.mother;
        frontMatter.street = this.street;
        frontMatter["post-code"] = this.postCode;
        frontMatter.city = this.city;
        frontMatter.country = this.country;
        frontMatter.phone = this.phone;
        frontMatter.email = this.email;
        frontMatter.url = this.url;

        if (this.file){
            const updatedContent = await this.updateFrontmatter(frontMatter);
            await this.app.vault.modify(this.file, updatedContent);
        }
        else
        {
            this.file = await this.app.vault.create(`People/${this.name}.md`, encodeFrontMatter(`# ${this.name}`, frontMatter));
        }
    }

    public select() {
        if (this.file){
            this.app.workspace.getLeaf().openFile(this.file);
        }
	}

    private async updateFrontmatter(frontmatter: Omit<FrontMatterCache, "position">): Promise<string> {
        if (!this.file){
            return "";
        }

        const data = await this.app.vault.read(this.file);
        const updated = Object.fromEntries(
            Object.entries(frontmatter)
                .filter(x => x[1] !== null && x[1] !== undefined)
                .map(x => isRawLink(x[1]) ? [x[0], `[[${x[1][0][0]}]]`] : x)
        );
        const encoded = encodeFrontMatter(data, updated);
        const cleaned = encoded.replace(/"\[\[(.*)\]\]"/g, (_, p1) => {
            return `[[${p1}]]`;
        });

        return cleaned;
    }
}

function encodeFrontMatter(data: string, frontmatter: Omit<FrontMatterCache, "position">): string {
    const delim = "---";
  
    const startPosition = data.indexOf(delim) + delim.length;
  
    const isStart = data.slice(0, startPosition).trim() === delim;
  
    const endPosition = data.slice(startPosition).indexOf(delim) + startPosition;
  
    const hasFrontMatter = isStart && endPosition > startPosition;
  
    if (Object.entries(frontmatter).length) {
      const res = hasFrontMatter
        ? data.slice(0, startPosition + 1) +
          stringifyYaml(frontmatter) +
          data.slice(endPosition)
        : delim + "\n" + stringifyYaml(frontmatter) + delim + "\n\n" + data;
  
      return res;
    }
  
    return hasFrontMatter
      ? data.slice(0, startPosition - delim.length) +
          data.slice(endPosition + delim.length + 1)
      : data;
}

function calculateAge(date: Date): Number {
    if (!date){
        return 0;
    }
    return (new Date(Date.now() - date.getTime())).getUTCFullYear() - 1970;
}

function getChildren(parent: TFile, app: App): TFile[] {
    const files = app.vault.getMarkdownFiles();
    return files.filter(file => isChildOf(file, parent, app))
}

function isChildOf(child: TFile, parent: TFile, app: App): boolean {
    const meta = app.metadataCache.getFileCache(child);
    return getField(meta?.frontmatter?.mother) == parent.basename ||
        getField(meta?.frontmatter?.father) == parent.basename;
}

function getField(obj: any){
    if (!Array.isArray(obj) || !Array.isArray(obj[0])) {
        return undefined;
    }
    return obj[0][0];
}

function isRawLink(value: any): value is Array<Array<string>> {
    if (value && Array.isArray(value)) {
      if (value.length === 1) {
        const nextValue = value[0];
  
        if (nextValue && Array.isArray(nextValue)) {
          return nextValue.length === 1;
        }
      }
    }
    return false;
}
function perseBirthday(str: string): Date {
    let date = new Date();
    const year = Number.parseInt(str.substring(0, 4));
    const month = Number.parseInt(str.substring(4, 6));
    const day = Number.parseInt(str.substring(6, 8));
    date.setFullYear(year, month, day);
    return date;
}

function parsePhone(tel: vCard.Property | vCard.Property[]): string {
    if (Array.isArray(tel)){
        let cell = tel.find(x => x.type == "cell");
        if (!cell){
            return "";
        }
        tel = cell;
    }
    return tel.valueOf();
}

function parseAddress(adr: vCard.Property | vCard.Property[]): [string, string, number, string] {
    if (Array.isArray(adr)){
        adr = adr[0];
    }
    const values = adr.valueOf().split(";");
    const street = values[2];
    const postCode = Number.parseInt(values[5]);
    const city = values[3];
    const country = values[6];
    return [street, city, postCode, country];
}

