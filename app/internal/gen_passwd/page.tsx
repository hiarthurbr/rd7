"use client";

import {
  Button,
  Description,
  FieldError,
  Form,
  Input,
  Label,
  Slider,
  Spinner,
  TextArea,
  TextField,
} from "@heroui/react";
import { hash } from "bcryptjs";
import { CheckIcon } from "lucide-react";
import { useState } from "react";
import z from "zod";

export default function Page() {
  const [input, setInput] = useState("");
  const [waitingPasswd, setWaitingPasswd] = useState(false);
  const [generatedPasswd, setGeneratedPasswd] = useState<null | string>(null);
  const [error, setError] = useState<null | string>(null);
  const [rounds, setRounds] = useState(10);

  return (
    <div className="size-full flex flex-col items-center justify-center min-h-screen space-y-8">
      <Form className="flex w-96 flex-col gap-4">
        <TextField isRequired minLength={8} name="password" type="password" isInvalid={!!error}>
          <Label>Password</Label>
          <Input
            placeholder="Enter your password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          {error == null ? (
            <Description>Insira a senha desejada</Description>
          ) : (
            <FieldError>{error}</FieldError>
          )}
        </TextField>

        <Slider
          className="w-full max-w-xs"
          defaultValue={10}
          minValue={1}
          maxValue={15}
          value={rounds}
          onChange={(rounds) => setRounds(rounds as number)}
        >
          <Label>Rounds</Label>
          <Slider.Output />
          <Slider.Track>
            <Slider.Fill />
            <Slider.Thumb />
          </Slider.Track>
        </Slider>

        <div className="flex gap-2">
          <Button
            type="submit"
            isPending={waitingPasswd}
            onPress={async () => {
              setWaitingPasswd(true);
              setError(null);
              setGeneratedPasswd(null);

              console.log(input);

              try {
                hash(z.string().min(8).max(8).parse(input), rounds)
                  .then((hash) => {
                    setGeneratedPasswd(Buffer.from(hash).toBase64());
                  })
                  .then(() => setWaitingPasswd(false));
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
                setWaitingPasswd(false);
              }
            }}
          >
            {({ isPending }) => (
              <>
                {isPending ? <Spinner color="current" size="sm" /> : <CheckIcon />}
                {isPending ? "Hashing..." : "Submit"}
              </>
            )}
          </Button>
        </div>
      </Form>

      <TextArea
        aria-label="Quick project update"
        className="h-32 w-96"
        value={generatedPasswd ?? "Your generated password will appear here"}
        readOnly
      />
    </div>
  );
}
