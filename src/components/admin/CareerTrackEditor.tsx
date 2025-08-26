
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
import type { CareerTrack } from "./types";

const formSchema = z.object({
  job_title: z.string().min(2, { message: "工作名称至少需要2个字符。" }),
  industry: z.string().optional(),
  location: z.string().optional(),
  experience_duration: z.string().optional(),
  required_skills: z.string().optional(),
  personality_fit: z.string().optional(),
  practitioner_major: z.string().optional(),
  practitioner_school: z.string().optional(),
  salary_range: z.string().optional(),
  recommendations: z.string().optional(),
});

type CareerTrackFormValues = z.infer<typeof formSchema>;

interface CareerTrackEditorProps {
  track?: CareerTrack | null;
  onSave: () => void;
  onCancel: () => void;
}

export default function CareerTrackEditor({ track, onSave, onCancel }: CareerTrackEditorProps) {
  const { toast } = useToast();
  const isEditing = !!track;

  const getAttributeValue = (attributeName: string) => {
    if (!track?.career_spark_attributes) return "";
    return track.career_spark_attributes.find(attr => attr.attribute_type === attributeName)?.attribute_value || "";
  };

  const form = useForm<CareerTrackFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      job_title: track?.job_title || "",
      industry: track?.industry || "",
      location: track?.location || "",
      experience_duration: getAttributeValue("experience_years"),
      required_skills: getAttributeValue("required_skills"),
      personality_fit: getAttributeValue("personality_fit"),
      practitioner_major: getAttributeValue("education_background"),
      practitioner_school: getAttributeValue("school_background"),
      salary_range: getAttributeValue("salary_range"),
      recommendations: getAttributeValue("recommendations"),
    },
  });

  async function onSubmit(values: CareerTrackFormValues) {
    try {
      const trackData = {
        job_title: values.job_title,
        industry: values.industry || null,
        location: values.location || null,
      };

      const attributesData = [
        { attribute_type: 'experience_years', attribute_value: values.experience_duration },
        { attribute_type: 'required_skills', attribute_value: values.required_skills },
        { attribute_type: 'personality_fit', attribute_value: values.personality_fit },
        { attribute_type: 'education_background', attribute_value: values.practitioner_major },
        { attribute_type: 'school_background', attribute_value: values.practitioner_school },
        { attribute_type: 'salary_range', attribute_value: values.salary_range },
        { attribute_type: 'recommendations', attribute_value: values.recommendations },
      ].filter(attr => attr.attribute_value);

      if (isEditing) {
        const { error: updateError } = await supabase
          .from("career_sparks")
          .update(trackData)
          .eq("id", track!.id);
        if (updateError) throw updateError;
        
        const attributeTypes = ['experience_years', 'required_skills', 'personality_fit', 'education_background', 'school_background', 'salary_range', 'recommendations'];
        const { error: deleteError } = await supabase
          .from('career_spark_attributes')
          .delete()
          .eq('spark_id', track!.id)
          .in('attribute_type', attributeTypes);
        if (deleteError) throw deleteError;

        if (attributesData.length > 0) {
            const attributesToInsert = attributesData.map(attr => ({
                spark_id: track!.id,
                ...attr
            }));
            const { error: insertError } = await supabase
              .from('career_spark_attributes')
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
        const sparkNumber = `CS-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

        const { data: newTrack, error: insertError } = await supabase
          .from("career_sparks")
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
              .from("career_spark_attributes")
              .insert(attributesToInsert);
            if (insertAttrError) throw insertAttrError;
        }
      }

      toast({
        title: isEditing ? "更新成功" : "创建成功",
        description: `求职火种已${isEditing ? '更新' : '创建'}。`,
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
        <FormField name="job_title" control={form.control} render={({ field }) => (
            <FormItem><FormLabel>工作</FormLabel><FormControl><Input placeholder="例如：产品经理" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField name="industry" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>工作行业</FormLabel><FormControl><Input placeholder="例如：互联网" {...field} value={field.value || ''}/></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField name="location" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>工作地点</FormLabel><FormControl><Input placeholder="例如：上海" {...field} value={field.value || ''}/></FormControl><FormMessage /></FormItem>
            )}/>
        </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField name="experience_duration" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>工作经验（时长）</FormLabel><FormControl><Input placeholder="例如：3-5年" {...field} value={field.value || ''}/></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField name="salary_range" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>薪资</FormLabel><FormControl><Input placeholder="例如：20-40k/月" {...field} value={field.value || ''}/></FormControl><FormMessage /></FormItem>
            )}/>
        </div>
        <FormField name="required_skills" control={form.control} render={({ field }) => (
            <FormItem><FormLabel>必备经验/技能/证书</FormLabel><FormControl><Textarea rows={3} placeholder="例如：熟悉Axure、SQL、项目管理证书" {...field} value={field.value || ''}/></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField name="personality_fit" control={form.control} render={({ field }) => (
            <FormItem><FormLabel>适合性格</FormLabel><FormControl><Textarea rows={3} placeholder="例如：沟通能力强、有同理心、抗压能力强" {...field} value={field.value || ''}/></FormControl><FormMessage /></FormItem>
        )}/>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField name="practitioner_school" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>从业者毕业学校</FormLabel><FormControl><Input placeholder="例如：复旦大学" {...field} value={field.value || ''}/></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField name="practitioner_major" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>从业者专业</FormLabel><FormControl><Input placeholder="例如：软件工程" {...field} value={field.value || ''}/></FormControl><FormMessage /></FormItem>
            )}/>
        </div>
        <FormField name="recommendations" control={form.control} render={({ field }) => (
            <FormItem><FormLabel>建议</FormLabel><FormControl><Textarea rows={4} placeholder="对求职者的建议..." {...field} value={field.value || ''}/></FormControl><FormMessage /></FormItem>
        )}/>
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
