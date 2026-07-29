import { handleSourceSearch } from "../_source-search.js";

export default {
  fetch(request: Request): Promise<Response> {
    return handleSourceSearch("dimria", request);
  },
};
