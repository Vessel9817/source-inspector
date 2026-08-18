import React, { ReactNode } from 'react';
import { NoChildren, NonStoredProps, StoredVirtualNodeProps } from '../base';
import { VirtualAttribute } from './attribute';

export interface SharedValues {
    xmlEncoding: string | null;
    xmlStandalone?: boolean;
}

export type StoredVirtualXmlDeclarationProps = StoredVirtualNodeProps
    & SharedValues
    & NoChildren;

export type VirtualXmlDeclarationProps = NonStoredProps<StoredVirtualXmlDeclarationProps>;

export function VirtualXmlDeclaration(
    props: VirtualXmlDeclarationProps
): ReactNode {
    return (
        <div className='document node'>
            {'<?xml'}
            <VirtualAttribute
                parentId={props.id}
                id={`${props.id}-xmlVersion`}
                nodeType={Node.ATTRIBUTE_NODE}
                nodeName={'xmlVersion'}
                nodeValue={'1.0'}
            />
            {
                props.xmlEncoding === null
                    ? undefined
                    : <VirtualAttribute
                        parentId={props.id}
                        id={`${props.id}-xmlEncoding`}
                        nodeType={Node.ATTRIBUTE_NODE}
                        nodeName={'xmlEncoding'}
                        nodeValue={props.xmlEncoding}
                    />
            }
            {
                props.xmlStandalone === undefined
                    ? undefined
                    : <VirtualAttribute
                        parentId={props.id}
                        id={`${props.id}-xmlStandalone`}
                        nodeType={Node.ATTRIBUTE_NODE}
                        nodeName={'xmlStandalone'}
                        // Should be a boolean, but is technically acceptable as a string
                        // https://developer.mozilla.org/en-US/docs/Glossary/Boolean/HTML
                        nodeValue={props.xmlStandalone.toString()}
                    />
            }
            {' ?>'}
        </div>
    );
}
