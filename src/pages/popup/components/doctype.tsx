import assert from 'assert';
import React, { ReactNode } from 'react';
import { NoChildren, NonStoredProps, StoredVirtualNodeProps } from '../base';
import { BaseUpdateMsg, validateBaseUpdateMsg } from '../msgs';

interface SharedValues {
    parentId: string;
    nodeType: Node['DOCUMENT_TYPE_NODE'];
    nodeName: string;
    nodeValue: null;
    publicId: string;
    systemId: string;
}

export type UpdateDoctypeMsg = BaseUpdateMsg & SharedValues;

export function validateUpdateDoctypeMsg(
    msg: Readonly<unknown>
): asserts msg is UpdateDoctypeMsg {
    validateBaseUpdateMsg(msg);
    assert.ok(msg.nodeType === Node.ATTRIBUTE_NODE);
    assert.ok(msg.nodeValue === null);
    assert.ok(msg.parentId != null);
    assert.ok('publicId' in msg);
    assert.ok(typeof msg.publicId === 'string');
    assert.ok('systemId' in msg);
    assert.ok(typeof msg.systemId === 'string');
}

export type StoredVirtualDoctypeProps = StoredVirtualNodeProps &
    SharedValues &
    NoChildren;

export type VirtualDoctypeProps = NonStoredProps<StoredVirtualDoctypeProps>;

export function VirtualDoctype(
    props: Readonly<VirtualDoctypeProps>
): ReactNode {
    let xmlId = '';

    if (props.publicId !== '') {
        xmlId += ` PUBLIC "${props.publicId}"`;

        if (props.systemId !== '') {
            xmlId += ` "${props.systemId}"`;
        }
    } else if (props.systemId !== '') {
        xmlId += ` SYSTEM "${props.systemId}"`;
    }

    return (
        <div className='doctype node'>
            {`<!DOCTYPE ${props.nodeName}${xmlId}>`}
        </div>
    );
}
