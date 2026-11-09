<?php

namespace Fixture\ApiH\Doc;

/**
 * A page that points at its sibling, {@see Hidden}, and at {@see Hidden::open()}.
 *
 * Data for @splicewire/beam-docs 03b (resolved-link identity). It is never loaded: laravel-beam-docs' generator only
 * parses it. PHP resolves the unqualified `Hidden` against this file's namespace, so the producer's target is
 * Fixture\ApiH\Doc\Hidden (unpublished under `public`), never the unrelated global \Hidden that is in the index.
 *
 * @api
 */
final class Page
{
    /** Holds a reference the producer does not resolve for this symbol: {@see Other}. */
    public ?object $note = null;

    /** Opens it. */
    public function open(): void {}
}
