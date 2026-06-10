"use client";

import { InputOTP, Label, ProgressBar, Surface } from "@heroui/react";
import { compare } from "bcryptjs";
import { useEffect, useState } from "react";
import z from "zod";

export function Auth({ Element, hash }: { Element: () => React.ReactNode; hash: string }) {
  z.base64().min(8).parse(hash);
  const [passwd, setPasswd] = useState(null);
  const [hashing, setHashing] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const [success, setSuccess] = useState<null | boolean>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `hash` é um valor estático
  useEffect(() => {
    if (passwd == null) return;
    setHashing(true);
    setError(null);

    try {
      compare(z.string().min(8).max(8).parse(passwd), Buffer.from(hash, 'base64').toString('utf-8'))
        .then((hash) => {
          setSuccess(hash);
        })
        .then(() => setHashing(false));
    } catch (err) {
      try {
        setError(
          JSON.parse((err as Error).message)
            // @ts-expect-error
            .map((e) => e.message)
            .join(", "),
        );
      } catch {
        setError((err as Error).message);
      }
      setHashing(false);
    }
  }, [passwd]);

  return success ? (
    <Element />
  ) : (
    <div className="w-full h-screen flex items-center justify-center">
      <Surface className="flex flex-col gap-2 rounded-3xl p-6 scale-150 items-center space-y-1">
        <div className="flex flex-col gap-1">
          <Label>Conteúdo sensível</Label>
          <p className="text-sm text-muted">
            Você está acessando um conteúdo sensível, por favor insira a senha para continuar.
          </p>
        </div>
        <InputOTP
          maxLength={8}
          className="pt-4"
          type="password"
          onComplete={(value) => setPasswd(value)}
          isInvalid={!!error}
          isDisabled={hashing}
          autoFocus
        >
          <InputOTP.Group>
            <InputOTP.Slot index={0} />
            <InputOTP.Slot index={1} />
            <InputOTP.Slot index={2} />
            <InputOTP.Slot index={3} />
          </InputOTP.Group>
          <InputOTP.Separator />
          <InputOTP.Group>
            <InputOTP.Slot index={4} />
            <InputOTP.Slot index={5} />
            <InputOTP.Slot index={6} />
            <InputOTP.Slot index={7} />
          </InputOTP.Group>
        </InputOTP>
        <span className="field-error" data-visible={!!error || success === false} id="code-error">
          {error ?? "Senha incorreta, tente novamente."}
        </span>
        <ProgressBar isIndeterminate={hashing} aria-label="Loading" className="w-64">
          <ProgressBar.Track className={hashing ? "" : "bg-transparent"}>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      </Surface>
    </div>
  );
}
