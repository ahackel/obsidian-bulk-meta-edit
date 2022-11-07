import { stringifyYaml, type App, type CachedMetadata, type FrontMatterCache, type TFile } from "obsidian";

export class Person{
    file: TFile;
    name: string;
    private _birthday: Date;
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

    get birthday(): Date { return this._birthday }
    set birthday(value: Date) { 
        this.birthday = value;
        const meta = app.metadataCache.getFileCache(this.file!);
        meta!.frontmatter!.birthday = value;
    }
    
    get birthdayString(): string{
        return this._birthday.toISOString().substring(0, 10);
    }

    get address(): string{
        const city = [this.postCode, this.city].filter(x => x).join(" ");
        return [this.street, city, this.country].filter(x => x).join("<br>");
    }

    constructor(file: TFile, readonly app: App) {
        this.file = file;

        const meta = app.metadataCache.getFileCache(file!);
        if (meta?.frontmatter){
            const { position, ...frontMatter }: FrontMatterCache = meta.frontmatter;
            this.updateFrontmatter(frontMatter);
        }
        
        this.name = this.file.basename;
        this._birthday = new Date(Date.parse(meta?.frontmatter?.birthday));
        this.age = this.calculateAge(this.birthday);
        this.father = meta?.frontmatter?.father?.[0]?.[0];
        this.mother = meta?.frontmatter?.mother?.[0]?.[0];
        this.children = this.getChildren(file, app).map(x => x.basename);

        this.street = meta?.frontmatter?.street;
        this.postCode = meta?.frontmatter?.["post-code"];
        this.city = meta?.frontmatter?.city;
        this.country = meta?.frontmatter?.country;
        this.phone = meta?.frontmatter?.phone;
        this.email = meta?.frontmatter?.email;
        this.url = meta?.frontmatter?.url;
    }

    private calculateAge(date: Date): Number {
        if (!date){
            return 0;
        }
        return (new Date(Date.now() - date.getTime())).getUTCFullYear() - 1970;
    }


    private getChildren(parent: TFile, app: App): TFile[] {
        const files = app.vault.getMarkdownFiles();
        return files.filter(file => this.isChildOf(file, parent, app))
    }

    private isChildOf(child: TFile, parent: TFile, app: App): boolean {
        const meta = app.metadataCache.getFileCache(child);
        return this.getField(meta?.frontmatter?.mother) == parent.basename ||
            this.getField(meta?.frontmatter?.father) == parent.basename;
    }

    private getField(obj: any){
        if (!Array.isArray(obj) || !Array.isArray(obj[0])) {
            return undefined;
        }
        return obj[0][0];
    }

    private async updateFrontmatter(frontmatter: Omit<FrontMatterCache, "position">){
        const data = await this.app.vault.read(this.file);
        console.log(encodeFrontMatter(data, frontmatter))
    }
}

function encodeFrontMatter(data: string, frontmatter: Omit<FrontMatterCache, "position">): string {
    console.log(typeof frontmatter.position);
    console.log(frontmatter)
    
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
