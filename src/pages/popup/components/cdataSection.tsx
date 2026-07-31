import assert from 'assert';
import React, { ReactNode } from 'react';
import type { NoChildren, NonStoredProps, StoredVirtualNodeProps } from '../base';
import { type BaseUpdateMsg, validateBaseUpdateMsg } from '../msgs';
import { VirtualInlineText } from './text';

interface SharedValues {
    parentId: string;
    nodeType: Node['CDATA_SECTION_NODE'];
    nodeName: '#cdata-section';
    nodeValue: string;
    prevSiblingId?: string;
}

export type UpdateCdataSectionMsg = BaseUpdateMsg & SharedValues;

export function validateUpdateCdataSectionMsg(
    msg: Readonly<unknown>
): asserts msg is UpdateCdataSectionMsg {
    validateBaseUpdateMsg(msg);
    assert.ok(msg.nodeType === Node.CDATA_SECTION_NODE);
    assert.ok(msg.nodeName === '#cdata-section');
    assert.ok(msg.nodeValue != null);
    assert.ok(msg.parentId != null);
}

export type StoredVirtualCdataSectionProps = StoredVirtualNodeProps &
    SharedValues &
    NoChildren;

export type VirtualCdataSectionProps =
    NonStoredProps<StoredVirtualCdataSectionProps>;

export function VirtualCdataSection(
    props: Readonly<VirtualCdataSectionProps>
): ReactNode {
    return (
        <div className='node'>
            <VirtualInlineText nodeValue={`<![CDATA[${props.nodeValue}]]>`} />
        </div>
    );
}
