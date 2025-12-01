import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, CheckCircle, Info, ShieldAlert, BrainCircuit } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// 1. Updated Interfaces to match the new Decision Intelligence JSON
interface ImpactItem {
  claim: string;
  domain: string;
  implied_action: string;
  predicted_consequence: string;
  recommendation: string;
}

interface AnalysisResult {
  article_summary: string;
  risk_level: "low" | "medium" | "high";
  decision_impact_analysis?: ImpactItem[]; // Optional because political articles might not have it yet
  missing_perspectives?: string[];
  credibility_check?: string;
  // Legacy fields for backward compatibility/political mode
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

// 2. The Helper Functions (These were missing and caused your error)
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
      
      {/* 1. Executive Decision Summary */}
      <Card className="p-6 shadow-md border-l-4 border-l-primary">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-primary" />
            Decision Intelligence
          </h3>
          <Badge variant={getRiskBadgeVariant(result.risk_level)} className="text-sm px-3 py-1">
            {result.risk_level.toUpperCase()} STRATEGIC RISK
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

      {/* 2. The Core Feature: Impact Mapping */}
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
                        If you act on: "{item.claim.substring(0, 40)}..."
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

      {/* 3. Blind Spots (What's missing) */}
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
      
      {/* 4. Fallback for older/political analysis if decision_impact_analysis is missing */}
      {!result.decision_impact_analysis && (
        <div className="text-sm text-muted-foreground">
           {/* You can add back the legacy Bias/Style meters here if you want to support both modes */}
           <p>Standard analysis mode active.</p>
        </div>
      )}
    </div>
  );
};
