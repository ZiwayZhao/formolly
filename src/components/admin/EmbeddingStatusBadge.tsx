
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, Loader, XCircle, Clock } from "lucide-react";

type EmbeddingStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface EmbeddingStatusBadgeProps {
  status?: EmbeddingStatus | null;
  error?: string | null;
}

const statusConfig = {
  pending: {
    label: "待处理",
    icon: <Clock className="w-3 h-3" />,
    className: "bg-gray-200 text-gray-700 hover:bg-gray-300",
  },
  processing: {
    label: "处理中",
    icon: <Loader className="w-3 h-3 animate-spin" />,
    className: "bg-blue-200 text-blue-700 hover:bg-blue-300",
  },
  completed: {
    label: "已向量化",
    icon: <CheckCircle2 className="w-3 h-3" />,
    className: "bg-green-200 text-green-700 hover:bg-green-300",
  },
  failed: {
    label: "失败",
    icon: <XCircle className="w-3 h-3" />,
    className: "bg-red-200 text-red-700 hover:bg-red-300",
  },
};

export default function EmbeddingStatusBadge({ status, error }: EmbeddingStatusBadgeProps) {
    if (!status) return null;

    const config = statusConfig[status] || statusConfig.pending;
    
    const badgeContent = (
        <Badge variant="outline" className={`flex items-center gap-1.5 text-xs font-normal border-0 ${config.className}`}>
            {config.icon}
            <span>{config.label}</span>
        </Badge>
    );

    if (status === 'failed' && error) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
                    <TooltipContent className="max-w-xs break-words bg-destructive text-destructive-foreground">
                        <p className="font-semibold flex items-center gap-1">失败原因:</p>
                        <p className="text-sm">{error}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }
    
    return badgeContent;
}
