import assert from 'assert';
import React, { ReactNode } from 'react';
import { NoChildren, NonStoredProps, StoredVirtualNodeProps } from '../base';
import { BaseUpdateMsg, validateBaseUpdateMsg } from '../msgs';
import { VirtualInlineText } from './text';

export interface SharedValues {
    parentId: string;
    nodeType: Node['PROCESSING_INSTRUCTION_NODE'];
    nodeValue: string;
    prevSiblingId?: string;
}

export type UpdateProcessingInstructionMsg = BaseUpdateMsg & SharedValues;

export function validateUpdateProcessingInstructionMsg(
    msg: Readonly<unknown>
): asserts msg is UpdateProcessingInstructionMsg {
    validateBaseUpdateMsg(msg);
    assert.ok(msg.nodeType === Node.PROCESSING_INSTRUCTION_NODE);
    assert.ok(msg.nodeValue != null);
    assert.ok(msg.parentId != null);
}

export type StoredVirtualProcessingInstructionProps = StoredVirtualNodeProps &
    SharedValues &
    NoChildren;

export type VirtualProcessingInstructionProps =
    NonStoredProps<StoredVirtualProcessingInstructionProps>;

export function VirtualProcessingInstruction(
    props: VirtualProcessingInstructionProps
): ReactNode {
    const data = props.nodeValue === '' ? '' : ' ' + props.nodeValue;

    return (
        <div className='node'>
            <VirtualInlineText nodeValue={`<?${props.nodeName}${data}?>`} />
        </div>
    );
}
