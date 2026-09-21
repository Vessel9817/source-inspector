import assert from 'assert';
import React, { ReactNode } from 'react';
import type { NoChildren, NonStoredProps, StoredVirtualNodeProps } from '../base';
import { type BaseUpdateMsg, validateBaseUpdateMsg } from '../msgs';

interface SharedValues {
    parentId: string;
    nodeType: Node['TEXT_NODE'];
    nodeName: '#text';
    nodeValue: string;
    prevSiblingId?: string;
}

export type UpdateTextMsg = BaseUpdateMsg & SharedValues;

/**
 * Validates the given message
 * @param msg The text node update message
 */
export function validateUpdateTextMsg(
    msg: Readonly<unknown>
): asserts msg is UpdateTextMsg {
    validateBaseUpdateMsg(msg);
    assert.ok(msg.nodeType === Node.TEXT_NODE);
    assert.ok(msg.nodeName === '#text');
    assert.ok(msg.nodeValue != null);
}

export type StoredVirtualTextProps = StoredVirtualNodeProps &
    SharedValues &
    NoChildren;

export type VirtualTextProps = NonStoredProps<StoredVirtualTextProps>;

/**
 * The source text node component
 * @param props The text node state
 * @returns A text node visualization
 */
export function VirtualText(props: Readonly<VirtualTextProps>): ReactNode {
    const hidden = props.nodeValue === '';

    return (
        <div className={hidden ? undefined : 'node'} hidden={hidden}>
            <VirtualInlineText nodeValue={props.nodeValue} />
        </div>
    );
}

// Key is handled by parent, so no parent ID is necessary
// Node is never persisted, so no ID is necessary
export interface VirtualInlineTextProps {
    nodeValue: string;
}

/**
 * The source inline text component
 * @param props The inline text state
 * @returns An inline text component
 */
export function VirtualInlineText(
    props: Readonly<VirtualInlineTextProps>
): ReactNode {
    return <pre className='text'>{props.nodeValue}</pre>;
}
