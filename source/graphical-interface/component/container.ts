import { Component } from "../component";
import { Element } from "../element";

export class Container extends Component {
    appendChild(child: Component) {
        this.element.appendChild(child.getProtectedElement());
    }
}