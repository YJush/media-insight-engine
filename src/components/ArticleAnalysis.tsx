import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, CheckCircle, Info } from "lucide-react";

interface AnalysisResult {
  article_type: string;
  political_bias_score: number;
  writing_style_score: number;
  article_summary: string;
  claims: string[];
  tone: string;
  bias: string;
  political_slant?: string;
  source_influence?: string;
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
  const isPolitical = result.article_type === "political";
  
  const getBiasLabel = (score: number) => {
    if (score < 30) return "Left-Leaning";
    if (score < 45) return "Center-Left";
    if (score < 55) return "Center";
    if (score < 70) return "Center-Right";
    return "Right-Leaning";
  };

  const getStyleLabel = (score: number) => {
    if (score < 30) return "Opinion-Heavy";
    if (score < 50) return "Mixed";
    if (score < 70) return "Mostly Factual";
    return "Highly Factual";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Article Summary */}
      <Card className="p-6 shadow-[var(--shadow-card)] border-2">
        <h3 className="text-lg font-semibold mb-3">Article Summary</h3>
        <p className="text-muted-foreground leading-relaxed">{result.article_summary}</p>
      </Card>

      {/* Bias & Style Meters */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Political Bias Meter */}
        <Card className="p-6 shadow-[var(--shadow-card)]">
          <h4 className="text-sm font-medium text-muted-foreground mb-4">Political Bias</h4>
          <div className="space-y-3">
            <div className="relative h-3 bg-gradient-to-r from-blue-500 via-gray-300 to-red-500 rounded-full">
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-foreground border-2 border-background rounded-full shadow-lg"
                style={{ left: `calc(${result.political_bias_score}% - 10px)` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Left</span>
              <span className="font-semibold text-foreground">{getBiasLabel(result.political_bias_score)}</span>
              <span>Right</span>
            </div>
          </div>
        </Card>

        {/* Writing Style Meter */}
        <Card className="p-6 shadow-[var(--shadow-card)]">
          <h4 className="text-sm font-medium text-muted-foreground mb-4">Writing Style</h4>
          <div className="space-y-3">
            <div className="relative h-3 bg-gradient-to-r from-amber-400 to-emerald-500 rounded-full">
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-foreground border-2 border-background rounded-full shadow-lg"
                style={{ left: `calc(${result.writing_style_score}% - 10px)` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Opinion</span>
              <span className="font-semibold text-foreground">{getStyleLabel(result.writing_style_score)}</span>
              <span>Factual</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Political Analysis (only for political articles) */}
      {isPolitical && (
        <Card className="p-6 shadow-[var(--shadow-card)] border-primary/20 bg-primary/5">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            Political Analysis
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Tone</h4>
              <p className="font-semibold capitalize">{result.tone}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Political Slant</h4>
              <p className="font-semibold capitalize">{result.political_slant}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Source Influence</h4>
              <p className="font-semibold">{result.source_influence}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-primary/10">
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Bias Assessment</h4>
            <p className="text-sm">{result.bias}</p>
          </div>
        </Card>
      )}

      {/* Risk Level Card */}
      <Card className="p-6 shadow-[var(--shadow-card)] border-2">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${getRiskBgColor(result.risk_level)} ${getRiskTextColor(result.risk_level)}`}>
            {getRiskIcon(result.risk_level)}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">Business Risk Assessment</h3>
            <div className="flex items-center gap-2">
              <Badge variant={getRiskBadgeVariant(result.risk_level)} className="text-sm">
                {result.risk_level.toUpperCase()} RISK
              </Badge>
              <span className="text-sm text-muted-foreground">
                for SME decision-making
              </span>
            </div>
          </div>
        </div>
      </Card>

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
              <span className="flex-1">{claim}</span>
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
