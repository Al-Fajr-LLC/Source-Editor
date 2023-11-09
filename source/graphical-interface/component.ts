import { Element } from "./element";

export { Label } from "./component/label";

export class Component {
    protected element: Element;

    getProtectedElement(): Element {
        return this.element;
    }
}