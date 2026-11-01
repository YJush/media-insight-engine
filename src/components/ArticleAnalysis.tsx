import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AlertCircle, 
  TrendingUp, 
  CheckCircle, 
  Info, 
  ShieldAlert, 
  BrainCircuit,
  Megaphone,
  Scale
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// --- Interfaces for Data Structure ---
interface ImpactItem {
  claim: string;
  domain: string;
  implied_action: string;
  predicted_consequence: string;
  recommendation: string;
}

interface EntityInfo {
  name: string;
  role: string;
  background_check: string;
}

interface IntegrityAnalysis {
  promotional_score: number;
  intent: string;
  logical_fallacies: string[];
  conflict_of_interest_warning: string | null;
}

interface AnalysisResult {
  article_summary: string;
  risk_level: "low" | "medium" | "high";
  decision_impact_analysis?: ImpactItem[];
  integrity_analysis?: IntegrityAnalysis;
  entities_and_funding?: EntityInfo[];
  missing_perspectives?: string[];
  credibility_check?: string;
  
  // Legacy fields for political/older compatibility
  article_type?: string;
  political_bias_score?: number;
  writing_style_score?: number;
  claims?: string[];
  tone?: string;
  bias?: string;
  political_slant?: string;
  source_influence?: string;
  possible_negative_consequences?: string[];
  suggested_actions?: string[];
}

interface ArticleAnalysisProps {
  result: AnalysisResult;
}

// --- Helper Functions for Styling ---
const getRiskBadgeVariant = (level: string): "success" | "warning" | "destructive" | "default" => {
  switch (level?.toLowerCase()) {
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
  switch (level?.toLowerCase()) {
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
  switch (level?.toLowerCase()) {
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
  switch (level?.toLowerCase()) {
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* 1. Executive Decision Summary */}
      <Card className="p-6 shadow-md border-l-4 border-l-primary">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-primary" />
            Decision Intelligence
          </h3>
          <Badge variant={getRiskBadgeVariant(result.risk_level)} className="text-sm px-3 py-1">
            {(result.risk_level || "UNKNOWN").toUpperCase()} STRATEGIC RISK
          </Badge>
        </div>
        <p className="text-muted-foreground mb-4">{result.article_summary}</p>
        
        {result.credibility_check && (
          <div className="bg-muted/30 p-3 rounded-md text-sm border border-border">
            <span className="font-semibold text-foreground">Source Credibility: </span>
            {result.credibility_check}
          </div>
        )}
      </Card>

      {/* 2. Impact Mapping (Accordion) */}
      {result.decision_impact_analysis && result.decision_impact_analysis.length > 0 && (
        <div className="grid gap-4">
          <h4 className="text-lg font-semibold flex items-center gap-2 mt-2">
            <ShieldAlert className="w-5 h-5 text-orange-500" />
            Projected Consequences & Countermeasures
          </h4>
          
          <Accordion type="single" collapsible className="w-full">
            {result.decision_impact_analysis.map((item, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`} className="border rounded-lg mb-4 px-4 bg-card shadow-sm">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex flex-col items-start text-left gap-1">
                    <div className="flex gap-2 items-center">
                      <Badge variant="outline" className="uppercase text-[10px] tracking-wider">
                        {item.domain}
                      </Badge>
                      <span className="font-medium text-sm text-muted-foreground">
                        If you act on: "{item.claim.substring(0, 50)}..."
                      </span>
                    </div>
                    <span className="font-semibold text-base mt-1">
                      Risk: {item.predicted_consequence}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="grid md:grid-cols-2 gap-4 mt-2 pt-4 border-t">
                    <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-md border border-red-100 dark:border-red-900/20">
                      <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase mb-1">
                        The Trap (Implied Action)
                      </p>
                      <p className="text-sm">{item.implied_action}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-md border border-green-100 dark:border-green-900/20">
                      <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase mb-1">
                        Recommended Countermeasure
                      </p>
                      <p className="text-sm">{item.recommendation}</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      {/* 3. NEW: Integrity & Motive Analysis */}
      {result.integrity_analysis && (
        <div className="grid md:grid-cols-2 gap-4">
          
          {/* Card A: Intent & Promotion */}
          <Card className="p-6 shadow-sm border-l-4 border-l-blue-500">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-blue-500" />
              Intent & Promotion
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Promotional Score</span>
                  <span className="font-bold">{result.integrity_analysis.promotional_score}/100</span>
                </div>
                <Progress value={result.integrity_analysis.promotional_score} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {result.integrity_analysis.promotional_score > 50 
                    ? "⚠️ High likelihood of commercial intent" 
                    : "✓ Appears objective"}
                </p>
              </div>

              <div className="bg-muted/30 p-3 rounded-md">
                <span className="text-xs font-uppercase text-muted-foreground block mb-1">DETECTED INTENT</span>
                <span className="font-medium text-foreground">{result.integrity_analysis.intent}</span>
              </div>

              {result.integrity_analysis.logical_fallacies?.length > 0 && (
                <div>
                  <span className="text-xs font-uppercase text-muted-foreground block mb-1">LOGICAL FALLACIES</span>
                  <div className="flex flex-wrap gap-2">
                    {result.integrity_analysis.logical_fallacies.map((fallacy, i) => (
                      <Badge key={i} variant="outline" className="text-xs border-orange-200 bg-orange-50 text-orange-700">
                        {fallacy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Card B: Conflict Check */}
          <Card className="p-6 shadow-sm border-l-4 border-l-purple-500">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-purple-500" />
              Conflict Check
            </h3>

            {result.integrity_analysis.conflict_of_interest_warning ? (
              <div className="bg-red-50 border border-red-100 p-3 rounded-md mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-700">Potential Conflict Detected</p>
                    <p className="text-sm text-red-600 mt-1">
                      {result.integrity_analysis.conflict_of_interest_warning}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600 mb-4 bg-green-50 p-3 rounded-md border border-green-100">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">No obvious conflicts found.</span>
              </div>
            )}

            <div className="space-y-3">
              <span className="text-xs font-uppercase text-muted-foreground">KEY ENTITIES BACKGROUND</span>
              {result.entities_and_funding?.map((entity, i) => (
                <div key={i} className="text-sm border-b last:border-0 pb-2 last:pb-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{entity.name}</span>
                    <Badge variant="secondary" className="text-[10px] h-5">{entity.role}</Badge>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {entity.background_check}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* 4. Blind Spots */}
      {result.missing_perspectives && result.missing_perspectives.length > 0 && (
        <Card className="p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-500" />
            Blind Spots & Missing Context
          </h3>
          <ul className="space-y-2">
            {result.missing_perspectives.map((point, idx) => (
              <li key={idx} className="flex gap-3 text-sm text-muted-foreground">
                <span className="text-blue-500">•</span>
                {point}
              </li>
            ))}
          </ul>
        </Card>
      )}
      
      {/* 5. Fallback for Political/Legacy format */}
      {isPolitical && (
        <Card className="p-6 shadow-sm border-primary/20 bg-primary/5">
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
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Bias</h4>
              <p className="font-semibold">{result.bias}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
