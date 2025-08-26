
import { ReactNode } from "react";

type StatCardProps = {
  title: string;
  value: string | number;
  icon?: ReactNode;
  footer?: ReactNode;
};

const StatCard = ({ title, value, icon, footer }: StatCardProps) => (
  <div className="bg-card rounded-lg shadow-sm p-6 flex flex-col gap-2 border min-w-[160px]">
    <div className="flex items-center gap-2 text-muted-foreground text-sm">
      {icon}
      <span>{title}</span>
    </div>
    <div className="text-2xl font-bold text-foreground">{value}</div>
    {footer && <div className="mt-2 text-xs text-muted-foreground">{footer}</div>}
  </div>
);

export default StatCard;
