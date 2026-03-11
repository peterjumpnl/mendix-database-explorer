import React from "react";
import collapseAllIcon from "../icons/CollapseAll.svg";
import expandAllIcon from "../icons/ExpandAll.svg";
import searchIcon from "../icons/Search.svg";
import groupedViewIcon from "../icons/GroupedList.svg";
import flatViewIcon from "../icons/FlatList.svg";
import { ViewMode } from "../types";

interface HeaderToolbarProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    onExpandAll: () => void;
    onCollapseAll: () => void;
    onToggleViewMode: () => void;
    onRefresh: () => void;
    viewMode: ViewMode;
}

export const HeaderToolbar: React.FC<HeaderToolbarProps> = ({
    searchQuery,
    onSearchChange,
    onExpandAll,
    onCollapseAll,
    onToggleViewMode,
    onRefresh,
    viewMode
}) => (
    <div className="header">
        <div className="header-inner header-left">
            <button onClick={onExpandAll} className="icon-btn" title="Expand All" aria-label="Expand All">
                <img src={expandAllIcon} alt="" draggable={false} />
            </button>
            <button onClick={onCollapseAll} className="icon-btn" title="Collapse All" aria-label="Collapse All">
                <img src={collapseAllIcon} alt="" draggable={false} />
            </button>
            <span className="header-separator" aria-hidden="true" />
        </div>

        <div className="header-inner header-center">
            <div className="search-container">
                <span className="search-icon" aria-hidden="true">
                    <img src={searchIcon} alt="" draggable={false} />
                </span>
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={e => onSearchChange(e.target.value)}
                />
            </div>
            <span className="header-separator" aria-hidden="true" />
        </div>

        <div className="header-inner header-right">
            <button
                onClick={onToggleViewMode}
                className="icon-btn view-toggle-btn"
                title={viewMode === "grouped" ? "Switch to A-Z Entity List" : "Switch to Grouped by Module"}
                aria-label={viewMode === "grouped" ? "Switch to A-Z Entity List" : "Switch to Grouped by Module"}
            >
                <img
                    src={viewMode === "grouped" ? groupedViewIcon : flatViewIcon}
                    alt=""
                    draggable={false}
                />
            </button>
            <button onClick={onRefresh} className="icon-btn refresh-icon-btn" title="Refresh" aria-label="Refresh">
                ⟳
            </button>
        </div>
    </div>
);
