
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { AcademicTrack } from "./types";

const formSchema = z.object({
  school_name: z.string().min(2, { message: "学校名称至少需要2个字符。" }),
  major_name: z.string().min(2, { message: "专业名称至少需要2个字符。" }),
  further_study_rate: z.string().optional(),
  further_study_destination: z.string().optional(),
  employment_rate: z.string().optional(),
  employment_destination: z.string().optional(),
  recommendations: z.string().optional(),
});

type AcademicTrackFormValues = z.infer<typeof formSchema>;

interface AcademicTrackEditorProps {
  track?: AcademicTrack | null;
  onSave: () => void;
  onCancel: () => void;
}

export default function AcademicTrackEditor({ track, onSave, onCancel }: AcademicTrackEditorProps) {
  const { toast } = useToast();
  const isEditing = !!track;

  const getAttributeValue = (attributeName: string) => {
    if (!track?.academic_spark_attributes) return "";
    return track.academic_spark_attributes.find(attr => attr.attribute_type === attributeName)?.attribute_value || "";
  };

  const form = useForm<AcademicTrackFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      school_name: track?.school_name || "",
      major_name: track?.major_name || "",
      further_study_rate: getAttributeValue("further_study_destination"),
      further_study_destination: getAttributeValue("further_study_destination"),
      employment_rate: getAttributeValue("employment_rate"),
      employment_destination: getAttributeValue("employment_destination"),
      recommendations: getAttributeValue("recommendations"),
    },
  });

  async function onSubmit(values: AcademicTrackFormValues) {
    try {
      const trackData = {
        school_name: values.school_name,
        major_name: values.major_name,
      };

      const attributeNames = [
          'further_study_rate', 'further_study_destination', 'employment_rate', 
          'employment_destination', 'recommendations'
      ];
      
      const attributesData = attributeNames
        .map(name => ({
          attribute_type: name,
          attribute_value: values[name as keyof AcademicTrackFormValues] as string,
        }))
        .filter(attr => attr.attribute_value);

      if (isEditing) {
        const { error: updateError } = await supabase
          .from("academic_sparks")
          .update(trackData)
          .eq("id", track!.id);
        if (updateError) throw updateError;

        const { error: deleteError } = await supabase
          .from('academic_spark_attributes')
          .delete()
          .eq('spark_id', track!.id)
          .in('attribute_type', attributeNames);
        if (deleteError) throw deleteError;
        
        if (attributesData.length > 0) {
            const attributesToInsert = attributesData.map(attr => ({
                spark_id: track!.id,
                ...attr
            }));
            const { error: insertError } = await supabase
              .from('academic_spark_attributes')
              .insert(attributesToInsert);
            if (insertError) throw insertError;
        }

      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast({ title: "未登录", description: "请先登录再操作", variant: "destructive" });
            return;
        }

        // 生成火种编号
        const sparkNumber = `AS-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

        const { data: newTrack, error: insertError } = await supabase
          .from("academic_sparks")
          .insert({ 
            ...trackData, 
            spark_number: sparkNumber,
            submitted_by: user.id 
          })
          .select('id')
          .single();
        if (insertError) throw insertError;
        if (!newTrack) throw new Error("创建火种失败");
        
        if (attributesData.length > 0) {
            const attributesToInsert = attributesData.map(attr => ({
                spark_id: newTrack.id,
                ...attr
            }));
            const { error: insertAttrError } = await supabase
              .from("academic_spark_attributes")
              .insert(attributesToInsert);
            if (insertAttrError) throw insertAttrError;
        }
      }

      toast({
        title: isEditing ? "更新成功" : "创建成功",
        description: `升学火种已${isEditing ? '更新' : '创建'}。`,
      });
      onSave();
    } catch (error: any) {
      toast({
        title: "操作失败",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="school_name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>学校名称</FormLabel>
                <FormControl>
                    <Input placeholder="例如：北京大学" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="major_name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>专业名称</FormLabel>
                <FormControl>
                    <Input placeholder="例如：计算机科学与技术" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="further_study_rate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>升学率</FormLabel>
                    <FormControl>
                        <Input placeholder="例如：80%" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="employment_rate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>就业率</FormLabel>
                    <FormControl>
                        <Input placeholder="例如：95%" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <FormField
            control={form.control}
            name="further_study_destination"
            render={({ field }) => (
                <FormItem>
                <FormLabel>升学去向</FormLabel>
                <FormControl>
                    <Textarea rows={3} placeholder="例如：主要去向为美国Top30院校..." {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="employment_destination"
            render={({ field }) => (
                <FormItem>
                <FormLabel>可能的就业去向</FormLabel>
                <FormControl>
                    <Textarea rows={3} placeholder="例如：互联网大厂、金融机构、国企等" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        <FormField
          control={form.control}
          name="recommendations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>建议</FormLabel>
              <FormControl>
                <Textarea rows={4} placeholder="对申请者的建议..." {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>取消</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? '保存中...' : '保存'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
