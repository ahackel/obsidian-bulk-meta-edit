import { Person } from "../data/Person";
import vCard from "vcf";

export function importContact(){
    let input: HTMLInputElement = document.createElement('input');
    input.type = 'file';
    input.onchange = _ => {
        // you can use this method to get file and perform respective operations
        let files = Array.from(input.files);
        const reader = new FileReader();
        reader.onload = async (e) => { 
            const card = new vCard().parse(e.target?.result as string);
            const name = card.data.fn.valueOf() as string;
            let person = Person.fromName(name, this.app);
            person.importVCard(card);
            await person.save();
            person.select();
        } 
        reader.readAsText(files[0])
    };
    input.click();
}