import assert from 'assert';
import React, { ReactNode } from 'react';
import type { NoChildren, NonStoredProps, StoredVirtualNodeProps } from '../base';
import { type BaseUpdateMsg, validateBaseUpdateMsg } from '../msgs';

type SharedValues = {
    id: string;
    parentId: string;
    nodeType: Node['ATTRIBUTE_NODE'];
    nodeName: string;
    nodeValue: string | null;
    prevSiblingId?: undefined;
};

export type UpdateAttributeMsg = BaseUpdateMsg & SharedValues;

/**
 * Validates the given message
 * @param msg The attribute state update message
 */
export function validateUpdateAttributeMsg(
    msg: Readonly<unknown>
): asserts msg is UpdateAttributeMsg {
    validateBaseUpdateMsg(msg);
    assert.ok(msg.nodeType === Node.ATTRIBUTE_NODE);
    assert.ok(msg.parentId != null);
    assert.ok(msg.prevSiblingId === undefined);
}

export type StoredVirtualAttributeProps = StoredVirtualNodeProps &
    SharedValues &
    NoChildren;

export type VirtualAttributeProps = NonStoredProps<StoredVirtualAttributeProps>;

/**
 * The source attribute component
 * @param props The attribute state
 * @returns An attribute visualization
 */
export function VirtualAttribute(
    props: Readonly<VirtualAttributeProps>
): ReactNode {
    return (
        <>
            <div className='attr'>{' ' + props.nodeName}</div>
            {['', null].includes(props.nodeValue) ? undefined : (
                <>
                    ="
                    <div className='string'>{props.nodeValue}</div>"
                </>
            )}
        </>
    );
}
