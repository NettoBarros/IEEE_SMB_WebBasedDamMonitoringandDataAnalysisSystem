import React, { useState } from 'react';
import "./tooltip.css"

const Tooltip = ({ text, children }) => {
    const [isHovering, setIsHovering] = useState(false);

    return (
        <>
        <div className='toptop'
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        >
        {children}
        </div>
        {isHovering &&
        <div className="tooltipMax">
            <div className="tooltip-text">{text}</div>
        </div>
        }
        </>
    );
};

export default Tooltip;