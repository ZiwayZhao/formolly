
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Check, X } from 'lucide-react';
import { useInvitationCodes } from '@/hooks/useInvitationCodes';

interface InvitationCodeInputProps {
  onValidCode: (code: string, invitationCodeId: string) => void;
  disabled?: boolean;
}

export function InvitationCodeInput({ onValidCode, disabled }: InvitationCodeInputProps) {
  const [code, setCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
    invitationCodeId?: string;
  } | null>(null);
  
  const { validateInvitationCode } = useInvitationCodes();

  const handleValidate = async () => {
    if (!code.trim()) {
      setValidationResult({ valid: false, message: '请输入邀请码' });
      return;
    }

    setValidating(true);
    setValidationResult(null);

    try {
      const result = await validateInvitationCode(code.trim().toUpperCase());
      
      if (result.valid && result.invitationCode) {
        setValidationResult({ 
          valid: true, 
          message: '邀请码验证成功！',
          invitationCodeId: result.invitationCode.id
        });
        onValidCode(code.trim().toUpperCase(), result.invitationCode.id);
      } else {
        setValidationResult({ 
          valid: false, 
          message: result.message || '邀请码验证失败'
        });
      }
    } catch (error) {
      setValidationResult({ 
        valid: false, 
        message: '验证过程中发生错误，请稍后重试'
      });
    } finally {
      setValidating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleValidate();
    }
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="invitationCode">邀请码（可选）</Label>
      <div className="flex space-x-2">
        <Input
          id="invitationCode"
          type="text"
          placeholder="请输入邀请码"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setValidationResult(null);
          }}
          onKeyPress={handleKeyPress}
          disabled={disabled || validating}
          className={`${
            validationResult 
              ? validationResult.valid 
                ? 'border-green-500 focus:ring-green-500' 
                : 'border-red-500 focus:ring-red-500'
              : ''
          }`}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleValidate}
          disabled={disabled || validating || !code.trim()}
        >
          {validating ? '验证中...' : '验证'}
        </Button>
      </div>
      
      {validationResult && (
        <div className={`flex items-center space-x-2 text-sm ${
          validationResult.valid ? 'text-green-600' : 'text-red-600'
        }`}>
          {validationResult.valid ? (
            <Check className="w-4 h-4" />
          ) : (
            <X className="w-4 h-4" />
          )}
          <span>{validationResult.message}</span>
        </div>
      )}
      
      <div className="text-xs text-gray-500">
        使用邀请码注册可以为邀请人提供20点火苗奖励
      </div>
    </div>
  );
}
