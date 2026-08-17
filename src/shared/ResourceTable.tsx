import type { ReactNode } from "react";

export function ResourceTable({ heads, children }: { heads: string[]; children: ReactNode }) {
  return <div className="table-scroll"><table><thead><tr>{heads.map((head) => <th key={head}>{head}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}
