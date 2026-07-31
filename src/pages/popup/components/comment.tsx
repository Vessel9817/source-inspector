import assert from 'assert';
import React, { ReactNode } from 'react';
import type { NoChildren, NonStoredProps, StoredVirtualNodeProps } from '../base';
import { type BaseUpdateMsg, validateBaseUpdateMsg } from '../msgs';

interface SharedValues {
    parentId: string;
    nodeType: Node['COMMENT_NODE'];
    nodeName: '#comment';
    nodeValue: string;
    prevSiblingId?: string;
}

export type UpdateCommentMsg = BaseUpdateMsg & SharedValues;

export function validateUpdateCommentMsg(
    msg: Readonly<unknown>
): asserts msg is UpdateCommentMsg {
    validateBaseUpdateMsg(msg);
    assert.ok(msg.nodeType === Node.COMMENT_NODE);
    assert.ok(msg.nodeName === '#comment');
    assert.ok(msg.nodeValue != null);
    assert.ok(msg.parentId != null);
}

export type StoredVirtualCommentProps = StoredVirtualNodeProps &
    SharedValues &
    NoChildren;

export type VirtualCommentProps = NonStoredProps<StoredVirtualCommentProps>;

export function VirtualComment(
    props: Readonly<VirtualCommentProps>
): ReactNode {
    return <pre className='comment node'>{`<!--${props.nodeValue}-->`}</pre>;
}
