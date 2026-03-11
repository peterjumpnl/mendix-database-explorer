import React from "react";
import entityPersistableIcon from "./icons/EntityPersistable.svg";
import entityNonPersistableIcon from "./icons/EntityNonPersistable.svg";
import entityViewIcon from "./icons/EntityView.svg";
import entityExternalIcon from "./icons/EntityExternal.svg";
import { EntityType } from "./types";

export const TableIcon = ({ entityType }: { entityType: EntityType }) => {
    const iconByType: Record<EntityType, string> = {
        persistable: entityPersistableIcon,
        "non-persistable": entityNonPersistableIcon,
        view: entityViewIcon,
        external: entityExternalIcon
    };

    return <img src={iconByType[entityType]} alt="" draggable={false} />;
};

export const AttributeIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <circle cx="7" cy="7" r="1.5" fill="#666"/>
    </svg>
);

export const AssociationIcon = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 10V6a2 2 0 012-2h4" stroke="#0066cc" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="2" cy="10" r="1.5" fill="#0066cc"/>
        <path d="M10 4l2 0M10 4l-2-2M10 4l-2 2" stroke="#0066cc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export const ChevronIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
