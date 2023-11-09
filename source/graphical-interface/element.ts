export class Element {
    #element: HTMLDivElement;
    #children: Element[];
    
    constructor() {
        this.#element = document.createElement("div");
    }

    getHTMLElement() {
        return this.#element;
    }

    getChildren() {
        return this.#children;
    }

    appendChild(child: Element) {
        this.#children.push(child);
        this.#element.appendChild(child.#element);
    }
}