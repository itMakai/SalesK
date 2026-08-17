"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";

const mpesaSchema = z.object({
  environment: z.enum(["sandbox", "production"]),
  shortcode: z.string().min(5, "Shortcode is required"),
  passkey: z.string().min(10, "Passkey is required"),
  consumerKey: z.string().min(10, "Consumer Key is required"),
  consumerSecret: z.string().min(10, "Consumer Secret is required"),
});

type MpesaFormValues = z.infer<typeof mpesaSchema>;

export default function PaymentSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);

  // In a real app, you would fetch these from the backend first
  const form = useForm<MpesaFormValues>({
    resolver: zodResolver(mpesaSchema),
    defaultValues: {
      environment: "sandbox",
      shortcode: "",
      passkey: "",
      consumerKey: "",
      consumerSecret: "",
    },
  });

  const onSubmit = async (data: MpesaFormValues) => {
    setIsSaving(true);
    try {
      // Hardcoded branch ID for MVP
      await apiClient.post("/branches/default-branch/payment-config", {
        provider: "mpesa",
        ...data,
      });
      alert("M-Pesa settings saved successfully.");
    } catch (error) {
      console.error("Failed to save M-Pesa config", error);
      alert("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment Integrations</h1>
        <p className="text-muted-foreground">
          Configure Daraja API keys for Lipa Na M-Pesa STK push.
        </p>
      </div>

      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <div className="w-8 h-8 rounded-full bg-[#4CAF50] mr-3 flex items-center justify-center">
            <span className="text-white font-bold text-xs">M</span>
          </div>
          M-Pesa Daraja Config
        </h2>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="environment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Environment</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select environment" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                      <SelectItem value="production">Production (Live)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Use Sandbox to test integrations without real money.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="shortcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paybill / Till Shortcode</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 174379" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passkey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passkey</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="bfb279f9aa9..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="consumerKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Consumer Key</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="consumerSecret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Consumer Secret</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Configuration
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
