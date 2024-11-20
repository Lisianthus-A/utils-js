// 返回现在到当前实例的相对时间
export const timeFromNow = (time: number | string) => {
  const dateNow = new Date();
  const dateTarget = new Date(time);

  const YYYY = dateTarget.getFullYear();
  const MM = String(dateTarget.getMonth() + 1).padStart(2, "0");
  const DD = String(dateTarget.getDate()).padStart(2, "0");
  const hh = String(dateTarget.getHours()).padStart(2, "0");
  const mm = String(dateTarget.getMinutes()).padStart(2, "0");

  if (dateNow.getFullYear() !== dateTarget.getFullYear()) {
    return `${YYYY}年${MM}月${DD}日`;
  }

  const diff = dateNow.getTime() - dateTarget.getTime();
  if (diff < 0) {
    return `${MM}月${DD}日`;
  }
  const remain =
    (dateNow.getHours() * 3600 +
      dateNow.getMinutes() * 60 +
      dateNow.getSeconds()) *
    1000 +
    dateNow.getMilliseconds();

  const ONE_DAY = 86400000;
  const mapDay: Record<string, string> = {
    1: "一",
    2: "二",
    3: "三",
    4: "四",
    5: "五",
    6: "六",
    7: "日",
  };

  if (diff <= remain) {
    return `${hh}:${mm}`;
  } else if (diff > ONE_DAY - remain && diff <= ONE_DAY + remain) {
    return `昨天 ${hh}:${mm}`;
  } else if (diff > 2 * ONE_DAY - remain && diff <= 2 * ONE_DAY + remain) {
    return `前天 ${hh}:${mm}`;
  } else if (diff <= 7 * ONE_DAY + remain) {
    const dayNow = dateNow.getDay() || 7;
    const dayTarget = dateTarget.getDay() || 7;
    if (dayNow > dayTarget) {
      return `星期${mapDay[dayTarget]} ${hh}:${mm}`;
    }
  }

  return `${MM}月${DD}日`;
};

interface AjaxRes<T = any> {
  code: number;
  data: T;
  message?: string;
  [key: string]: any;
}

class Ajax {
  private codeMessage: Record<string, string> = {
    400: "400: 发出的请求有错误，服务器没有进行新建或修改数据的操作。",
    401: "401: 用户没有权限（令牌、用户名、密码错误）。",
    403: "403: 用户得到授权，但是访问是被禁止的。",
    404: "404: 发出的请求针对的是不存在的记录，服务器没有进行操作。",
    406: "406: 请求的格式不可得。",
    410: "410: 请求的资源被永久删除，且不会再得到的。",
    422: "422: 当创建一个对象时，发生一个验证错误。",
    500: "500: 服务器发生错误，请检查服务器。",
    502: "502: 网关错误。",
    503: "503: 服务不可用，服务器暂时过载或维护。",
    504: "504: 网关超时。",
  }

  private buildErrorJson(message?: string): AjaxRes {
    return { code: 500, data: null, message: message || "请求异常" };
  }

  private async request<T = any>(
    url: string,
    options?: RequestInit
  ): Promise<AjaxRes<T>> {
    options = options || {};
    options.headers = options.headers || {};

    const res = await fetch(url, options).catch((e) => {
      console.log(`catch error when fetch url: ${url}`, e);
    });

    if (!res) {
      return this.buildErrorJson();
    }

    const json = await res
      .json()
      .catch(() =>
        this.buildErrorJson(this.codeMessage[res.status] || res.statusText)
      );

    // 没有权限
    if (res.status === 401 || res.status === 403) {
      // do something
    }

    // 没有权限
    if (json.code === 401 || json.code === 403) {
      // do something
    }

    return json;
  }

  get<T = any>(url: string, data?: Record<string, any>) {
    data = data || {};
    let paramsUrl = "";
    paramsUrl += "?";
    for (const key in data) {
      paramsUrl += `${key}=${data[key]}&`;
    }
    paramsUrl = paramsUrl.slice(0, -1);

    return this.request<T>(url + paramsUrl, {
      method: "GET",
      credentials: "include",
    });
  }

  post<T = any>(url: string, data: any, options?: RequestInit) {
    return this.request<T>(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      ...options,
    });
  }

  patch<T = any>(url: string, data: any, options?: RequestInit) {
    return this.request<T>(url, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      ...options,
    });
  }

  delete<T = any>(url: string, data: any, options?: RequestInit) {
    return this.request<T>(url, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      ...options,
    });
  }
}

export const ajax = new Ajax();

interface FormatObj {
  /**
   * 日期格式，默认 YYYY-MM-DD hh:mm:ss
   */
  format?: string;
  /**
   * 日期，默认选取当前日期
   */
  date?: Date;
}
/**
 * 格式化日期
 * @param formatObj 日期对象
 */
export const formatDate = (formatObj?: FormatObj | string | number) => {
  if (formatObj === undefined) {
    formatObj = {
      format: "YYYY-MM-DD hh:mm:ss",
      date: new Date(),
    };
  } else if (typeof formatObj === "string" || typeof formatObj === "number") {
    formatObj = {
      format: "YYYY-MM-DD hh:mm:ss",
      date: new Date(formatObj),
    };
  }

  let format = formatObj.format || "YYYY-MM-DD hh:mm:ss";
  const date = formatObj.date || new Date();

  const o: Record<string, number> = {
    "M+": date.getMonth() + 1,
    "D+": date.getDate(),
    "h+": date.getHours(),
    "m+": date.getMinutes(),
    "s+": date.getSeconds(),
  };

  const matchY = format.match(/Y+/);
  if (matchY) {
    format = format.replace(
      matchY[0],
      String(date.getFullYear()).slice(4 - matchY[0].length)
    );
  }

  for (const k in o) {
    const matchResult = format.match(new RegExp(k));
    if (matchResult) {
      format = format.replace(
        matchResult[0],
        String(o[k]).padStart(matchResult[0].length, "0")
      );
    }
  }

  return format;
};

// 将类似 `data:image/png;base64,xxxxxxxx` 之类的字符串转成文件
export const dataUrlToFile = (
  dataUrl: string,
  fileName: string,
  type?: string
) => {
  const data = dataUrl.split(",")[1];
  const decodedData = atob(data);
  const u8Array = new Uint8Array(decodedData.length);
  for (let i = 0; i < decodedData.length; ++i) {
    u8Array[i] = decodedData.charCodeAt(i);
  }
  return new File([u8Array], fileName, { type });
};

// 复制文本
export const copyText = async (text: string) => {
  if (!text) {
    return;
  }

  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }

  const el = document.createElement("textarea");
  el.value = text;
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
};

// 获取从 min 到 max 的随机整数，包括 min 和 max
export const random = (min: number, max: number) => {
  const diff = max - min + 1;
  return (min + Math.random() * diff) >> 0;
};

// 将 num 取 n 位小数
export const toDecimal = (num: number | string, n = 2) => {
  n = Math.max(0, n);
  if (n === 0) {
    return String(Number(num) >> 0);
  }

  const str = num.toString();
  const index = str.indexOf(".");
  if (index === -1) {
    return str + "." + "0".repeat(n);
  } else {
    const temp = str.slice(0, index);
    return temp + str.slice(index, index + 1 + n).padEnd(n + 1, "0");
  }
};
