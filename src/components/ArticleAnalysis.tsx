import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, CheckCircle, Info } from "lucide-react";

interface Claim {
  text: string;
}

interface AnalysisResult {
  claims: Claim[];
  tone: string;
  bias: string;
  risk_level: "low" | "medium" | "high";
  possible_negative_consequences: string[];
  suggested_actions: string[];
}

interface ArticleAnalysisProps {
  result: AnalysisResult;
}

const getRiskBadgeVariant = (level: string): "success" | "warning" | "destructive" | "default" => {
  switch (level) {
    case "low":
      return "success";
    case "medium":
      return "warning";
    case "high":
      return "destructive";
    default:
      return "default";
  }
};

const getRiskTextColor = (level: string) => {
  switch (level) {
    case "low":
      return "text-success";
    case "medium":
      return "text-warning";
    case "high":
      return "text-destructive";
    default:
      return "text-muted-foreground";
  }
};

const getRiskBgColor = (level: string) => {
  switch (level) {
    case "low":
      return "bg-success/10";
    case "medium":
      return "bg-warning/10";
    case "high":
      return "bg-destructive/10";
    default:
      return "bg-muted/10";
  }
};

const getRiskIcon = (level: string) => {
  switch (level) {
    case "low":
      return <CheckCircle className="w-5 h-5" />;
    case "medium":
      return <AlertCircle className="w-5 h-5" />;
    case "high":
      return <AlertCircle className="w-5 h-5" />;
    default:
      return <Info className="w-5 h-5" />;
  }
};

export const ArticleAnalysis = ({ result }: ArticleAnalysisProps) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Risk Level Card */}
      <Card className="p-6 shadow-[var(--shadow-card)] border-2">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${getRiskBgColor(result.risk_level)} ${getRiskTextColor(result.risk_level)}`}>
            {getRiskIcon(result.risk_level)}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">Risk Assessment</h3>
            <div className="flex items-center gap-2">
              <Badge variant={getRiskBadgeVariant(result.risk_level)} className="text-sm">
                {result.risk_level.toUpperCase()} RISK
              </Badge>
              <span className="text-sm text-muted-foreground">
                for business decision-making
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tone & Bias */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5 shadow-[var(--shadow-card)]">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Tone</h4>
          <p className="text-lg font-semibold capitalize">{result.tone}</p>
        </Card>
        <Card className="p-5 shadow-[var(--shadow-card)]">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Bias</h4>
          <p className="text-lg font-semibold capitalize">{result.bias}</p>
        </Card>
      </div>

      {/* Claims */}
      <Card className="p-6 shadow-[var(--shadow-card)]">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Key Claims
        </h3>
        <ul className="space-y-3">
          {result.claims.map((claim, idx) => (
            <li key={idx} className="flex gap-3 text-sm">
              <span className="text-primary font-semibold mt-0.5">{idx + 1}.</span>
              <span className="flex-1">{typeof claim === 'string' ? claim : claim.text}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Negative Consequences */}
      <Card className="p-6 shadow-[var(--shadow-card)] border-warning/30 bg-warning/5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-warning" />
          Potential Risks
        </h3>
        <ul className="space-y-3">
          {result.possible_negative_consequences.map((consequence, idx) => (
            <li key={idx} className="flex gap-3 text-sm">
              <span className="text-warning font-semibold mt-0.5">⚠</span>
              <span className="flex-1">{consequence}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Suggested Actions */}
      <Card className="p-6 shadow-[var(--shadow-card)] border-success/30 bg-success/5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-success" />
          Recommended Actions
        </h3>
        <ul className="space-y-3">
          {result.suggested_actions.map((action, idx) => (
            <li key={idx} className="flex gap-3 text-sm">
              <span className="text-success font-semibold mt-0.5">✓</span>
              <span className="flex-1">{action}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};
