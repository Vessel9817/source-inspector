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
    isXML: boolean;
    /** @deprecated Not supported in Firefox; deprecated in Chrome */
    xmlEncoding: string | null;
    /** @deprecated Not supported in Firefox; deprecated in Chrome */
    xmlStandalone: boolean;
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
    assert.ok('isXML' in msg);
    assert.ok(typeof msg.isXML === 'boolean');
    assert.ok('xmlStandalone' in msg);
    assert.ok(typeof msg.xmlStandalone === 'boolean');

    if ('xmlEncoding' in msg && msg.xmlEncoding !== null) {
        assert.ok(typeof msg.xmlEncoding === 'string');
    }
}

export type StoredVirtualDocumentProps = StoredVirtualNodeProps & SharedValues;

export type VirtualDocumentProps = NonStoredProps<StoredVirtualDocumentProps>;

export function VirtualDocument(props: VirtualDocumentProps): ReactNode {
    const xmlDecl = props.isXML
        ? <VirtualXmlDeclaration
            id={`${props.id}-xmldecl`}
            nodeType={props.nodeType}
            nodeName={props.nodeName}
            nodeValue={props.nodeValue}
            isXML={props.isXML}
            xmlEncoding={props.xmlEncoding}
            xmlStandalone={props.xmlStandalone}
        />
        : undefined;

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
