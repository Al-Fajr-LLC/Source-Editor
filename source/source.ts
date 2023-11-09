import { Label } from "./graphical-interface/component";
import { Container } from "./graphical-interface/component/container";
import { Element } from "./graphical-interface/element";

const body = new Container();
const text = new Label("Hello World");

body.appendChild(text);

document.body.appendChild(body.getProtectedElement().getHTMLElement());