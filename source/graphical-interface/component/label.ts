import { Component } from "../component";

export class Label extends Component {
    constructor(text: string) {
        super();
        this.setText(text);
    }

    setText(text: string) {
        this.element.getHTMLElement().innerText = text;
    }

    getText(): string {
        return this.element.getHTMLElement().innerText;
    }
}