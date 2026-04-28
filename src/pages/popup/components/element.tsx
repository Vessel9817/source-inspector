import assert from 'assert';
import React, { ReactNode } from 'react';
import { NonStoredProps, StoredVirtualNodeProps } from '../base';
import { BaseUpdateMsg, validateBaseUpdateMsg } from '../msgs';

interface SharedValues {
    nodeType: Node['ELEMENT_NODE'];
}

export type UpdateElementMsg = BaseUpdateMsg & SharedValues;

export type StoredVirtualElementProps = StoredVirtualNodeProps &
    SharedValues & { attributeIds: Set<string> };

export type VirtualElementProps = NonStoredProps<StoredVirtualElementProps>;

export function validateUpdateElementMsg(
    msg: Readonly<unknown>
): asserts msg is UpdateElementMsg {
    validateBaseUpdateMsg(msg);
    assert.ok(msg.nodeType === Node.ELEMENT_NODE);
}

export function VirtualElement(
    props: Readonly<VirtualElementProps>
): ReactNode {
    // Parts of this component's rendering are handled by the child manager
    return (
        <div className='node'>
            {`<${props.nodeName}`}
            {props.children}
        </div>
    );
}
