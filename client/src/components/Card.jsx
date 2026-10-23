import React, { memo } from "react";

/**
 * Reusable Card component with modern styling
 */
const Card = memo(
  ({
    children,
    className = "",
    hover = false,
    padding = "md",
    shadow = "base",
    border = true,
    ...props
  }) => {
    const paddingClasses = {
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
      none: "p-0",
    };

    const shadowClasses = {
      none: "",
      sm: "shadow-sm",
      base: "shadow-md",
      lg: "shadow-lg",
      xl: "shadow-2xl",
    };

    const baseClasses = [
      "card rounded-2xl transition-all duration-300 ease-out",
      "backdrop-blur-sm", // subtle glassy effect
      paddingClasses[padding],
      shadowClasses[shadow],
      border ? "border" : "border-0",
      hover
        ? "hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] cursor-pointer"
        : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={baseClasses} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export default Card;
