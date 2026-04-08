"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useSdrStore } from "../store/sdr-store";
import { Mail, Send, Clock, CheckCircle } from "lucide-react";

export function WorkspaceSection() {
  const { selectedLead } = useSdrStore();
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailHistory, setEmailHistory] = useState<{ subject: string; date: string; status: string }[]>([
    { subject: "Following up on our conversation", date: "2024-01-15", status: "sent" },
    { subject: "Introduction to RIVO1", date: "2024-01-10", status: "opened" },
  ]);

  const handleSendEmail = () => {
    if (!emailSubject || !emailBody) return;
    
    setEmailHistory([
      { subject: emailSubject, date: new Date().toISOString().split("T")[0], status: "sent" },
      ...emailHistory,
    ]);
    setEmailSubject("");
    setEmailBody("");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedLead ? (
            <>
              <div className="p-4 rounded-lg bg-muted">
                <p className="font-medium">
                  {selectedLead.firstName} {selectedLead.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedLead.company}
                </p>
                <Badge variant="secondary" className="mt-2">
                  {selectedLead.status}
                </Badge>
              </div>

              <div className="space-y-3">
                <Input
                  placeholder="Email subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
                <Textarea
                  placeholder="Write your email..."
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={6}
                />
                <Button 
                  className="w-full" 
                  onClick={handleSendEmail}
                  disabled={!emailSubject || !emailBody}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Select a lead to view actions
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {emailHistory.map((email, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
              >
                <Mail className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{email.subject}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {email.date}
                    </span>
                    {email.status === "opened" && (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
