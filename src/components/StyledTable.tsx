import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const StyledTable = Table;
export const StyledTableHeader = TableHeader;
export const StyledTableBody = TableBody;
export const StyledTableCell = TableCell;
export const StyledTableHead = TableHead;

export const StyledTableRow = ({ className = "", ...props }: React.ComponentProps<typeof TableRow>) => (
  <TableRow className={`bg-table-row-bg hover:bg-table-row-hover border-0 ${className}`} {...props} />
);

export const StyledTableHeaderRow = ({ className = "", ...props }: React.ComponentProps<typeof TableRow>) => (
  <TableRow className={`hover:bg-transparent bg-transparent border-0 ${className}`} {...props} />
);

/*
 * USAGE:
 *
 * import { StyledTable, StyledTableHeader, StyledTableBody, StyledTableHeaderRow, StyledTableRow, StyledTableCell, StyledTableHead } from "@/components/StyledTable";
 *
 * <StyledTable>
 *   <StyledTableHeader>
 *     <StyledTableHeaderRow>
 *       <StyledTableHead>Column 1</StyledTableHead>
 *       <StyledTableHead>Column 2</StyledTableHead>
 *     </StyledTableHeaderRow>
 *   </StyledTableHeader>
 *   <StyledTableBody>
 *     <StyledTableRow>
 *       <StyledTableCell>Data</StyledTableCell>
 *       <StyledTableCell>Data</StyledTableCell>
 *     </StyledTableRow>
 *   </StyledTableBody>
 * </StyledTable>
 */
