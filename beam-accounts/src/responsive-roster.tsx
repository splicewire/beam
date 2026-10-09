import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { cn, DataTable, useIsMobile } from "@schemastud/ui";

/**
 * A roster that stays usable on a phone. On a wide screen it is the shared `DataTable`; below the
 * foundation's 768px breakpoint ({@link useIsMobile}) every row becomes a stacked card that renders the
 * SAME column cells, so a row's status and its actions are always on screen instead of parked past the
 * right edge of a sideways scroller (TOWER-05 shots-r5: at 390px Rotate/Archive, resend/cancel and Status
 * were off-screen, and a pending -> active flip could not be seen on mobile).
 *
 * The first column is the card's heading, a column whose id is `actions` is the card's footer, and every
 * other column is a labelled field (its string header is the label).
 */
export function ResponsiveRoster<TData extends { id: string }>({
  columns,
  data,
  loading = false,
  rowClassName,
  emptyMessage,
}: {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  loading?: boolean;
  rowClassName?: (row: TData) => string | undefined;
  emptyMessage: string;
}) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        rowClassName={rowClassName}
        emptyMessage={emptyMessage}
      />
    );
  }

  return (
    <StackedRows
      columns={columns}
      data={data}
      loading={loading}
      rowClassName={rowClassName}
      emptyMessage={emptyMessage}
    />
  );
}

function StackedRows<TData extends { id: string }>({
  columns,
  data,
  loading,
  rowClassName,
  emptyMessage,
}: {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  loading: boolean;
  rowClassName?: (row: TData) => string | undefined;
  emptyMessage: string;
}) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });
  const rows = table.getRowModel().rows;

  if (loading && rows.length === 0) {
    return (
      <div className="space-y-2" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg border bg-muted/40"
          />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {rows.map((row) => {
        const [heading, ...rest] = row.getVisibleCells();
        const actions = rest.find((cell) => cell.column.id === "actions");
        const fields = rest.filter((cell) => cell.column.id !== "actions");
        return (
          <li
            key={row.id}
            data-testid={`stacked-row-${row.id}`}
            className={cn(
              "min-w-0 space-y-2.5 rounded-lg border bg-card p-3",
              rowClassName?.(row.original)
            )}
          >
            <div className="min-w-0">
              {flexRender(heading.column.columnDef.cell, heading.getContext())}
            </div>
            {fields.length > 0 && (
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 text-[12.5px]">
                {fields.map((cell) => {
                  const header = cell.column.columnDef.header;
                  return (
                    <div key={cell.id} className="contents">
                      <dt className="text-muted-foreground">
                        {typeof header === "string" ? header : cell.column.id}
                      </dt>
                      <dd className="min-w-0">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            )}
            {actions && (
              <div className="flex flex-wrap items-center justify-end gap-1.5 border-t pt-2">
                {flexRender(
                  actions.column.columnDef.cell,
                  actions.getContext()
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
