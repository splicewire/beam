import { useBeamMessages } from '../../messages';
import { Loader2Icon } from "lucide-react"

import { cn } from '../../lib/utils'

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  const messages = useBeamMessages();
  return (
    <Loader2Icon
      role="status"
      aria-label={messages.t('splicewire-beam-inertia::messages.chrome_loading')}
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
