import assert from 'assert';
import React, { ReactNode } from 'react';
import type { NonStoredProps, StoredVirtualNodeProps } from '../base';
import { type BaseUpdateMsg, validateBaseUpdateMsg } from '../msgs';

interface SharedValues {
    nodeType: Node['ELEMENT_NODE'];
}

export type UpdateElementMsg = BaseUpdateMsg & SharedValues;

export type StoredVirtualElementProps = StoredVirtualNodeProps
    & SharedValues
    & {
        /**
         * References to the element's attribute IDs
         */
        attributeIds: Set<string>;
        /**
         * Used to highlight a void element that erroneously contains children
         */
        error?: boolean;
    };

export type VirtualElementProps = NonStoredProps<StoredVirtualElementProps>;

/**
 * Validates the given message
 * @param msg The element state update message
 */
export function validateUpdateElementMsg(
    msg: Readonly<unknown>
): asserts msg is UpdateElementMsg {
    validateBaseUpdateMsg(msg);
    assert.ok(msg.nodeType === Node.ELEMENT_NODE);
}

/**
 * The source element component
 * @param props The element state
 * @returns An element visualization
 * @implNote Parts of this component's rendering are handled by the child manager
 */
export function VirtualElement(
    props: Readonly<VirtualElementProps>
): ReactNode {
    return (
        <div className={props.error ? 'node error' : 'node'}>
            {`<${props.nodeName}`}
            {props.children}
        </div>
    );
}
