namespace Commands {
    // Create element
    export interface CreateElementPacket {
        command: Names.CreateElement,
        element_type: CreateElementType
    }

    export enum CreateElementType {
        Div,
        Span,
        P
    }

    // Register event listener
    export interface RegisterEventListenerPacket {
        command: Names.RegisterEventListener,
        event_name: RegisterEventListenerNames
    }

    export enum RegisterEventListenerNames {
        Click,
        MouseEnter,
        MouseLeave
    }

    // Commands
    export enum Names {
        CreateElement,
        RegisterEventListener
    }
    
    export type Packet = CreateElementPacket | RegisterEventListenerPacket;
}

export default Commands;