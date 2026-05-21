import type { TableColumn, TableRow } from "@/lib/admin-content";
import styles from "./AdminPage.module.css";

type AdminDataTableProps = {
  caption: string;
  columns: readonly TableColumn[];
  rows: readonly TableRow[];
  pillKeys?: readonly string[];
};

function resolveCellTone(value: string) {
  if (/正常|启用|可控|全部可见|推荐|置顶|成功率/.test(value)) {
    return styles.pillPositive;
  }

  if (/待审核|待处理|处理中|人工复审|待下架|可重试|建议/.test(value)) {
    return styles.pillWarning;
  }

  if (/禁用|已驳回|高优先级|失败|风险|下线|已升级/.test(value)) {
    return styles.pillCritical;
  }

  return styles.pillNeutral;
}

export function AdminDataTable({ caption, columns, rows, pillKeys = [] }: AdminDataTableProps) {
  return (
    <div className={styles.tableWrap}>
      <div className={styles.tableCaption}>{caption}</div>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => {
                const value = row[column.key] ?? "";
                const shouldPill = pillKeys.includes(column.key);

                return (
                  <td key={column.key}>
                    {shouldPill ? <span className={`${styles.pill} ${resolveCellTone(value)}`}>{value}</span> : value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
