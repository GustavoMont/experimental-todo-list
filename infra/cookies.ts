import { serialize, SerializeOptions } from "cookie";
import parse from "set-cookie-parser";
import { splitCookiesString } from "set-cookie-parser";

type CookieParams = {
  name: string;
  value: string;
};

class CookieService {
  createCookie(cookie: CookieParams, options: SerializeOptions): string {
    return serialize(cookie.name, cookie.value, options);
  }

  parseCookie(cookie: string) {
    const splitCookieHeaders = splitCookiesString(cookie);
    const parsedCookie = parse(splitCookieHeaders, {
      map: true,
    });

    return parsedCookie;
  }
}

export const cookieService = new CookieService();
