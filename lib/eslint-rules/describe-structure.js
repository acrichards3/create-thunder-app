/** @type {import("eslint").Rule.RuleModule} */
const describeStructure = {
  meta: {
    docs: {
      description: "Enforce WHEN/AND describe nesting and max one it() per describe block",
    },
    messages: {
      andRequired: "Nested describe blocks beyond the first level must start with 'AND ' (got '{{title}}').",
      multipleIt:
        "A describe block may contain at most one it() call. Move additional it() blocks into nested describe blocks.",
      whenRequired: "The first level of nested describe blocks must start with 'WHEN ' (got '{{title}}').",
    },
    schema: [],
    type: "suggestion",
  },

  create(context) {
    const describeStack = [];

    const getTitle = (node) => {
      const arg = node.arguments[0];
      if (!arg) return null;
      if (arg.type === "Literal" && typeof arg.value === "string") return arg.value;
      if (arg.type === "TemplateLiteral" && arg.quasis.length === 1) {
        return arg.quasis[0].value.cooked ?? null;
      }
      return null;
    };

    const isDescribeCall = (node) =>
      node.type === "CallExpression" && node.callee.type === "Identifier" && node.callee.name === "describe";

    const isItCall = (node) => {
      if (node.type !== "CallExpression") return false;
      const { callee } = node;
      if (callee.type === "Identifier") {
        return callee.name === "it" || callee.name === "test";
      }
      if (callee.type === "MemberExpression" && callee.object.type === "Identifier") {
        return callee.object.name === "it" || callee.object.name === "test";
      }
      return false;
    };

    return {
      CallExpression(node) {
        if (!isDescribeCall(node)) return;

        const depth = describeStack.length;
        const title = getTitle(node);

        if (depth === 1 && title !== null) {
          if (!title.startsWith("WHEN ")) {
            context.report({
              data: { title },
              messageId: "whenRequired",
              node: node.arguments[0],
            });
          }
        }

        if (depth >= 2 && title !== null) {
          if (!title.startsWith("AND ")) {
            context.report({
              data: { title },
              messageId: "andRequired",
              node: node.arguments[0],
            });
          }
        }

        describeStack.push({ itCount: 0, node });
      },

      "CallExpression:exit"(node) {
        if (!isDescribeCall(node)) return;
        describeStack.pop();
      },

      ExpressionStatement(node) {
        if (describeStack.length === 0) return;

        const expr = node.expression;
        if (!isItCall(expr)) return;

        const current = describeStack[describeStack.length - 1];
        current.itCount += 1;

        if (current.itCount > 1) {
          context.report({
            messageId: "multipleIt",
            node: expr,
          });
        }
      },
    };
  },
};

export default describeStructure;
