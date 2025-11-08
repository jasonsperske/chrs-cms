import React from "react"
import { TableBody, TableCell, TableRow } from "./table"

const TableSubBody = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement> & { sectionName?: string | React.ReactElement, cols: number }
>(({ className, sectionName, cols, children }) => {
    return (
        <TableBody className={className}>
            {
                sectionName ?
                    <TableRow>
                        <TableCell className="text-center font-bold text-lg" colSpan={cols}>
                            <a
                                href={`/section/${encodeURIComponent(
                                    typeof sectionName === "string" ? sectionName : ""
                                )}`}
                                className="hover:underline"
                                style={{ color: "inherit", textDecoration: "none" }}
                            >
                                {sectionName}
                            </a>
                        </TableCell>
                    </TableRow>
                    : null}
            {children}
        </TableBody>
    )
})
TableSubBody.displayName = "TableSubBody"

export { TableSubBody }