export {
    UpdateAttributeMsg,
    UpdateCdataSectionMsg,
    UpdateCommentMsg,
    UpdateDoctypeMsg,
    UpdateDocumentMsg,
    UpdateElementMsg,
    UpdateProcessingInstructionMsg,
    UpdateTextMsg
} from './components';
import assert from 'assert';
import {
    UpdateAttributeMsg,
    UpdateCdataSectionMsg,
    UpdateCommentMsg,
    UpdateDoctypeMsg,
    UpdateDocumentMsg,
    UpdateElementMsg,
    UpdateProcessingInstructionMsg,
    UpdateTextMsg,
    validateUpdateAttributeMsg,
    validateUpdateCdataSectionMsg,
    validateUpdateCommentMsg,
    validateUpdateDoctypeMsg,
    validateUpdateDocumentMsg,
    validateUpdateElementMsg,
    validateUpdateProcessingInstructionMsg,
    validateUpdateTextMsg
} from './components';

interface Msg {
    type: string;
    msgIndex: number;
}

function validateMsg(msg: Readonly<unknown>): asserts msg is Msg {
    assert.ok(msg != null);
    assert.ok(typeof msg === 'object');
    assert.ok('type' in msg);
    assert.ok(typeof msg.type === 'string');
    assert.ok('msgIndex' in msg);
    assert.ok(typeof msg.msgIndex === 'number');
}

export interface ConnectMsg extends Omit<Msg, 'msgIndex'> {
    type: 'connection';
    tabId: number;
}

export function validateConnectMsg(
    msg: Readonly<unknown>
): asserts msg is Readonly<ConnectMsg> {
    assert.ok(msg != null);
    assert.ok(typeof msg === 'object');
    assert.ok('type' in msg);
    assert.ok(msg['type'] === 'connection');
    assert.ok('tabId' in msg);
    assert.ok(typeof msg.tabId === 'number');
}

export interface RemoveMsg extends Msg {
    type: 'remove';
    id: string;
}

function validateRemoveMsg(msg: Readonly<unknown>): asserts msg is RemoveMsg {
    validateMsg(msg);
    assert.ok(msg.type === 'remove');
    assert.ok('id' in msg);
    assert.ok(typeof msg.id === 'string');
}

export interface BaseUpdateMsg extends Msg {
    type: 'update';
    id: string;
    nodeType: number;
    nodeName: string;
    nodeValue: string | null;
    parentId?: string | undefined;
    prevSiblingId?: string;
}

export function validateBaseUpdateMsg(
    msg: Readonly<unknown>
): asserts msg is BaseUpdateMsg {
    validateMsg(msg);
    assert.ok(msg.type === 'update');
    assert.ok('id' in msg);
    assert.ok(typeof msg.id === 'string');
    assert.ok('nodeType' in msg);
    assert.ok(typeof msg.nodeType === 'number');
    assert.ok('nodeName' in msg);
    assert.ok(typeof msg.nodeName === 'string');
    assert.ok('nodeValue' in msg);
    assert.ok(msg.nodeValue === null || typeof msg.id === 'string');
    assert.ok(
        !('parentId' in msg) ||
            msg.parentId === undefined ||
            typeof msg.parentId === 'string'
    );
    assert.ok(
        !('prevSiblingId' in msg) ||
            msg.prevSiblingId === undefined ||
            typeof msg.prevSiblingId === 'string'
    );
}

export interface UpdateEntityRefMsg extends BaseUpdateMsg {
    nodeType: Node['ENTITY_REFERENCE_NODE'];
}

function validateUpdateEntityRefMsg(
    msg: Readonly<unknown>
): asserts msg is UpdateEntityRefMsg {
    validateBaseUpdateMsg(msg);
    assert.ok(msg.nodeType === Node.ENTITY_REFERENCE_NODE);
}

export interface UpdateEntityMsg extends BaseUpdateMsg {
    nodeType: Node['ENTITY_NODE'];
}

function validateUpdateEntityMsg(
    msg: Readonly<unknown>
): asserts msg is UpdateEntityMsg {
    validateBaseUpdateMsg(msg);
    assert.ok(msg.nodeType === Node.ENTITY_NODE);
}

export interface UpdateDocFragmentMsg extends BaseUpdateMsg {
    nodeType: Node['DOCUMENT_FRAGMENT_NODE'];
}

function validateUpdateDocFragmentMsg(
    msg: Readonly<unknown>
): asserts msg is UpdateDocFragmentMsg {
    validateBaseUpdateMsg(msg);
    assert.ok(msg.nodeType === Node.DOCUMENT_FRAGMENT_NODE);
}

export interface UpdateNotationMsg extends BaseUpdateMsg {
    nodeType: Node['NOTATION_NODE'];
}

function validateUpdateNotationMsg(
    msg: Readonly<unknown>
): asserts msg is UpdateEntityRefMsg {
    validateBaseUpdateMsg(msg);
    assert.ok(msg.nodeType === Node.NOTATION_NODE);
}

export type UpdateMsg =
    | UpdateElementMsg
    | UpdateAttributeMsg
    | UpdateTextMsg
    | UpdateCdataSectionMsg
    | UpdateEntityRefMsg
    | UpdateEntityMsg
    | UpdateProcessingInstructionMsg
    | UpdateCommentMsg
    | UpdateDocumentMsg
    | UpdateDoctypeMsg
    | UpdateDocFragmentMsg
    | UpdateNotationMsg;

function validateUpdateMsg(msg: Readonly<unknown>): asserts msg is UpdateMsg {
    try {
        validateUpdateElementMsg(msg);
        return;
    } catch {}
    try {
        validateUpdateAttributeMsg(msg);
        return;
    } catch {}
    try {
        validateUpdateTextMsg(msg);
        return;
    } catch {}
    try {
        validateUpdateCdataSectionMsg(msg);
        return;
    } catch {}
    try {
        validateUpdateEntityRefMsg(msg);
        return;
    } catch {}
    try {
        validateUpdateEntityMsg(msg);
        return;
    } catch {}
    try {
        validateUpdateProcessingInstructionMsg(msg);
        return;
    } catch {}
    try {
        validateUpdateCommentMsg(msg);
        return;
    } catch {}
    try {
        validateUpdateDocumentMsg(msg);
        return;
    } catch {}
    try {
        validateUpdateDoctypeMsg(msg);
        return;
    } catch {}
    try {
        validateUpdateDocFragmentMsg(msg);
        return;
    } catch {}
    try {
        validateUpdateNotationMsg(msg);
        return;
    } catch {}
}

export type PopupMsg = RemoveMsg | UpdateMsg;

export function validatePopupMsg(
    msg: Readonly<unknown>
): asserts msg is PopupMsg {
    try {
        validateRemoveMsg(msg);
    } catch {
        validateUpdateMsg(msg);
    }
}
