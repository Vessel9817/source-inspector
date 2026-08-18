import assert from 'assert';
import React, { ReactNode } from 'react';
import type { NonStoredProps, StoredVirtualNodeProps } from '../base';
import { type BaseUpdateMsg, validateBaseUpdateMsg } from '../msgs';
import { VirtualXmlDeclaration } from './xmlDeclaration';

interface SharedValues {
    nodeType: Node['DOCUMENT_NODE'];
    nodeName: '#document';
    nodeValue: null;
    prevSiblingId?: undefined;
    documentURI: string;
    contentType: string;

    /** @deprecated Not supported in Firefox; deprecated in Chrome */
    xmlEncoding: string | null;
    /** @deprecated Not supported in Firefox; deprecated in Chrome */
    xmlStandalone?: boolean;
}

export type UpdateDocumentMsg = BaseUpdateMsg & SharedValues;

export function validateUpdateDocumentMsg(
    msg: Readonly<unknown>
): asserts msg is UpdateDocumentMsg {
    validateBaseUpdateMsg(msg);
    assert.ok(msg.nodeType === Node.DOCUMENT_NODE);
    assert.ok(msg.nodeName === '#document');
    assert.ok(msg.nodeValue === null);
    assert.ok(msg.prevSiblingId === undefined);
    assert.ok('documentURI' in msg);
    assert.ok(typeof msg.documentURI === 'string');
    assert.ok('contentType' in msg);
    assert.ok(typeof msg.contentType === 'string');

    if ('xmlEncoding' in msg && msg.xmlEncoding !== null) {
        assert.ok(typeof msg.xmlEncoding === 'string');
    }
    if ('xmlStandalone' in msg) {
        assert.ok(['undefined', 'boolean'].includes(typeof msg.xmlStandalone));
    }
}

export type StoredVirtualDocumentProps = StoredVirtualNodeProps & SharedValues;

export type VirtualDocumentProps = NonStoredProps<StoredVirtualDocumentProps>;

export function VirtualDocument(props: VirtualDocumentProps): ReactNode {
    let xmlDecl: ReactNode = undefined;

    if (props.contentType === 'application/xhtml+xml') {
        xmlDecl = (
            <VirtualXmlDeclaration
                id={`${props.id}-xmldecl`}
                nodeType={props.nodeType}
                nodeName={props.nodeName}
                nodeValue={props.nodeValue}
                xmlEncoding={props.xmlEncoding}
                xmlStandalone={props.xmlStandalone}
            />
        );
    }

    // For security, don't change the rel attribute
    // See: https://stackoverflow.com/a/17711167/8387760
    return (
        <div className='document node'>
            {`${props.nodeName} (`}
            <a
                target='_blank'
                rel='noopener noreferrer'
                href={props.documentURI}
            >
                {props.documentURI}
            </a>
            {`)`}
            <ul>
                {xmlDecl}
                {props.children}
            </ul>
        </div>
    );
}
