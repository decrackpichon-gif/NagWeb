function cleanProps(props = {}) {
  const next = { ...props };
  delete next.children;
  return next;
}

function component(name, props = {}, children = []) {
  return {
    kind: "component",
    name,
    props,
    children
  };
}

function element(tag, props = {}, children = []) {
  return {
    kind: "element",
    tag,
    props,
    children
  };
}

function demoText(title, body) {
  return element(
    "div",
    {
      className:
        "flex min-h-24 w-full flex-col justify-center gap-1 rounded-xl border border-zinc-200 bg-white p-5 text-zinc-950 shadow-sm"
    },
    [
      element("strong", { className: "text-base font-semibold" }, [title]),
      element("span", { className: "text-sm text-zinc-500" }, [body])
    ]
  );
}

export function buildReactPreviewRecipe(
  resource,
  { primaryExport, defaultProps = {} } = {}
) {
  const provider = resource.source?.provider || "";
  const name = resource.name || "";
  const baseProps = cleanProps(defaultProps);

  if (provider === "magicui" && name === "android") {
    return component(
      "Android",
      {
        ...baseProps,
        width: 170,
        height: 346,
        className: "h-auto max-h-[300px] w-auto"
      }
    );
  }

  if (provider === "magicui" && name === "magic-card") {
    return component(
      "MagicCard",
      {
        ...baseProps,
        className:
          "h-56 w-[min(420px,78vw)] rounded-2xl bg-white p-7 shadow-sm"
      },
      [
        element("div", { className: "relative z-50 flex h-full flex-col justify-end" }, [
          element("div", { className: "text-xs font-medium uppercase tracking-[0.18em] text-zinc-400" }, [
            "Magic UI"
          ]),
          element("div", { className: "mt-2 text-2xl font-semibold text-zinc-950" }, [
            "Magic Card"
          ]),
          element("div", { className: "mt-1 text-sm text-zinc-500" }, [
            "Mové el cursor sobre la tarjeta."
          ])
        ])
      ]
    );
  }

  if (provider === "magicui" && name === "animated-theme-toggler") {
    return component(
      "AnimatedThemeToggler",
      {
        ...baseProps,
        theme: "light",
        duration: 350,
        className:
          "rounded-full border border-zinc-200 bg-white p-3 text-zinc-900 shadow-sm"
      }
    );
  }

  if (provider === "magicui" && name === "hero-video-dialog") {
    return component(
      "HeroVideoDialog",
      {
        ...baseProps,
        animationStyle: "from-center",
        videoSrc: "about:blank",
        thumbnailSrc:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='960' height='540'%3E%3Crect width='100%25' height='100%25' fill='%2318181b'/%3E%3Ccircle cx='480' cy='270' r='54' fill='%23ffffff' fill-opacity='.18'/%3E%3Cpolygon points='462,235 462,305 522,270' fill='white'/%3E%3C/svg%3E",
        thumbnailAlt: "NagWeb video preview",
        className: "w-[min(680px,80vw)]"
      }
    );
  }

  if (provider === "magicui" && name === "code-comparison") {
    return component(
      "CodeComparison",
      {
        ...baseProps,
        beforeCode: "const color = 'red'\nconsole.log(color)",
        afterCode: "const color = 'blue'\nconsole.log(color)",
        language: "ts",
        filename: "example.ts",
        lightTheme: "github-light",
        darkTheme: "github-dark",
        highlightColor: "#dbeafe"
      }
    );
  }

  if (provider === "magicui" && name === "tweet-card") {
    return component(
      "TweetSkeleton",
      {
        className: "w-[min(440px,78vw)]"
      }
    );
  }

  if (provider === "magicui" && name === "client-tweet-card") {
    return demoText(
      "Client Tweet Card",
      "Preview offline segura. La consulta remota del tweet se desactiva dentro del sandbox."
    );
  }

  if (provider === "motion-primitives" && name === "animated-background") {
    return component(
      "AnimatedBackground",
      {
        ...baseProps,
        defaultValue: "uno",
        enableHover: true,
        className: "rounded-lg bg-zinc-900 shadow-sm"
      },
      [
        element(
          "button",
          {
            "data-id": "uno",
            className:
              "rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 data-[checked=true]:text-white"
          },
          ["Uno"]
        ),
        element(
          "button",
          {
            "data-id": "dos",
            className:
              "rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 data-[checked=true]:text-white"
          },
          ["Dos"]
        ),
        element(
          "button",
          {
            "data-id": "tres",
            className:
              "rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 data-[checked=true]:text-white"
          },
          ["Tres"]
        )
      ]
    );
  }

  if (provider === "motion-primitives" && name === "accordion") {
    return component(
      "Accordion",
      {
        ...baseProps,
        expandedValue: "item-1",
        className: "w-[min(440px,78vw)] rounded-xl border border-zinc-200 bg-white"
      },
      [
        component(
          "AccordionItem",
          { value: "item-1", className: "border-b border-zinc-200 px-4" },
          [
            component(
              "AccordionTrigger",
              {
                className:
                  "flex w-full items-center justify-between py-4 text-left font-medium"
              },
              ["¿Qué es Motion Primitives?"]
            ),
            component(
              "AccordionContent",
              {
                className:
                  "overflow-hidden pb-4 text-sm leading-6 text-zinc-500"
              },
              ["Componentes React animados y reutilizables."]
            )
          ]
        ),
        component(
          "AccordionItem",
          { value: "item-2", className: "px-4" },
          [
            component(
              "AccordionTrigger",
              {
                className:
                  "flex w-full items-center justify-between py-4 text-left font-medium"
              },
              ["¿Se puede editar?"]
            ),
            component(
              "AccordionContent",
              {
                className:
                  "overflow-hidden pb-4 text-sm leading-6 text-zinc-500"
              },
              ["NagWeb conserva el código y sus propiedades editables."]
            )
          ]
        )
      ]
    );
  }

  if (provider === "shadcn" && name === "accordion") {
    return component(
      "Accordion",
      {
        ...baseProps,
        type: "single",
        defaultValue: "item-1",
        collapsible: true,
        className: "w-[min(440px,78vw)]"
      },
      [
        component("AccordionItem", { value: "item-1" }, [
          component("AccordionTrigger", {}, ["Biblioteca local"]),
          component(
            "AccordionContent",
            {},
            ["Este componente se está ejecutando desde el Code Vault."]
          )
        ]),
        component("AccordionItem", { value: "item-2" }, [
          component("AccordionTrigger", {}, ["Editable"]),
          component(
            "AccordionContent",
            {},
            ["Después NagWeb puede exponer variantes y propiedades visuales."]
          )
        ])
      ]
    );
  }

  if (provider === "shadcn" && name === "alert") {
    return component(
      "Alert",
      {
        ...baseProps,
        className: "w-[min(460px,78vw)]"
      },
      [
        component("AlertTitle", {}, ["Recurso listo"]),
        component(
          "AlertDescription",
          {},
          ["Código, dependencias y preview viven dentro del Vault."]
        )
      ]
    );
  }

  if (provider === "shadcn" && name === "alert-dialog") {
    return component(
      "AlertDialog",
      {
        ...baseProps,
        defaultOpen: true
      },
      [
        component("AlertDialogTrigger", {}, ["Abrir diálogo"]),
        component("AlertDialogContent", {}, [
          component("AlertDialogHeader", {}, [
            component("AlertDialogTitle", {}, ["Preview de Alert Dialog"]),
            component(
              "AlertDialogDescription",
              {},
              ["El botón que usa esta preview se resolvió desde el Vault local."]
            )
          ]),
          component("AlertDialogFooter", {}, [
            component("AlertDialogCancel", {}, ["Cancelar"]),
            component("AlertDialogAction", {}, ["Continuar"])
          ])
        ])
      ]
    );
  }

  if (provider === "shadcn" && name === "aspect-ratio") {
    return component(
      "AspectRatio",
      {
        ...baseProps,
        ratio: 16 / 9,
        className:
          "w-[min(480px,78vw)] overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100"
      },
      [
        element(
          "div",
          {
            className:
              "flex h-full w-full items-end bg-gradient-to-br from-zinc-900 via-zinc-700 to-zinc-400 p-5 text-white"
          },
          ["16 : 9"]
        )
      ]
    );
  }

  if (provider === "shadcn" && name === "button") {
    return component(
      "Button",
      {
        ...baseProps,
        variant: "default"
      },
      ["Button"]
    );
  }


  if (provider === "shadcn" && name === "sidebar") {
    return component(
      "SidebarProvider",
      {
        defaultOpen: true,
        className: "min-h-[360px] w-[min(760px,82vw)]"
      },
      [
        component(
          "Sidebar",
          {
            collapsible: "none",
            className: "w-64 border-r border-zinc-200"
          },
          [
            component("SidebarHeader", {}, [
              element(
                "div",
                {
                  className:
                    "rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white"
                },
                ["NagWeb"]
              )
            ]),
            component("SidebarContent", {}, [
              component("SidebarGroup", {}, [
                component("SidebarGroupLabel", {}, ["Biblioteca"]),
                component("SidebarGroupContent", {}, [
                  element(
                    "div",
                    {
                      className:
                        "grid gap-2 px-2 py-1 text-sm text-zinc-600"
                    },
                    [
                      element("div", {}, ["Recursos"]),
                      element("div", {}, ["Componentes"]),
                      element("div", {}, ["Animaciones"])
                    ]
                  )
                ])
              ])
            ]),
            component("SidebarFooter", {}, [
              element(
                "div",
                {
                  className:
                    "px-3 py-2 text-xs text-zinc-400"
                },
                ["Preview offline"]
              )
            ])
          ]
        ),
        component("SidebarInset", {}, [
          element(
            "div",
            {
              className:
                "flex h-full min-h-[360px] flex-1 items-center justify-center p-8"
            },
            [
              demoText(
                "Sidebar",
                "El hook use-mobile y sus subcomponentes se resuelven desde el Vault local."
              )
            ]
          )
        ])
      ]
    );
  }

  if (provider === "shadcn" && name === "chart") {
    return component(
      "ChartContainer",
      {
        ...baseProps,
        config: {
          visitors: {
            label: "Visitas",
            color: "#2563eb"
          }
        },
        className: "w-[min(520px,78vw)]"
      },
      [
        element(
          "svg",
          {
            viewBox: "0 0 320 180",
            className: "h-full w-full",
            role: "img",
            "aria-label": "Gráfico de ejemplo"
          },
          [
            element("polyline", {
              points: "20,140 80,100 140,120 200,55 300,80",
              fill: "none",
              stroke: "var(--color-visitors)",
              strokeWidth: 8,
              strokeLinecap: "round",
              strokeLinejoin: "round"
            }),
            element("circle", {
              cx: 200,
              cy: 55,
              r: 7,
              fill: "var(--color-visitors)"
            })
          ]
        )
      ]
    );
  }

  return component(
    primaryExport || "default",
    baseProps,
    defaultProps.children != null
      ? [defaultProps.children]
      : [demoText(resource.title || resource.name || "NagWeb Preview", resource.description || "Preview del recurso.")]
  );
}
