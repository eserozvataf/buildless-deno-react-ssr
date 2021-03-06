import reactDomServer from "https://esm.sh/react-dom@18.1.0/server";
import { StaticRouter } from "https://esm.sh/react-router-dom@5.3.3";
import * as oak from "https://deno.land/x/oak@v10.6.0/mod.ts";
import * as dejs from "https://deno.land/x/dejs@0.10.3/mod.ts";
import * as fs from "https://deno.land/std@0.149.0/fs/mod.ts";
import * as streams from "https://deno.land/std@0.149.0/streams/mod.ts";
import * as path from "https://deno.land/std@0.149.0/path/mod.ts";
// import * as asserts from "https://deno.land/std@0.149.0/testing/asserts.ts";

export { dejs, fs, oak, path, reactDomServer, StaticRouter, streams };
