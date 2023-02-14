const { ApolloServer } = require("@apollo/server");
const {
  startStandaloneServer,
} = require("@apollo/server/standalone");
const { buildSubgraphSchema } = require("@apollo/subgraph");
const { gql } = require("graphql-tag");
const lifts = require("./lift-data.json");

const typeDefs = gql`
  type Lift {
    id: ID!
    name: String!
    status: LiftStatus!
    capacity: Int!
    night: Boolean!
    elevationGain: Int!
    trailAccess: [Trail!]!
  }
  
  extend type Trail @key(fields: "id") {
    id: ID! @external
    liftAccess: [Lift!]!
  }

  enum LiftStatus {
    OPEN
    HOLD
    CLOSED
  }

  type Query {
    allLifts(status: LiftStatus): [Lift!]!
    Lift(id: ID!): Lift!
    liftCount(status: LiftStatus): Int!
  }

  type Mutation {
    setLiftStatus(id: ID!, status: LiftStatus!): Lift!
  }
`;
const resolvers = {
  Query: {
    allLifts: (root, { status }) =>
      !status
        ? lifts
        : lifts.filter((lift) => lift.status === status),
    Lift: (root, { id }) =>
      lifts.find((lift) => id === lift.id),
    liftCount: (root, { status }) =>
      !status
        ? lifts.length
        : lifts.filter((lift) => lift.status === status)
            .length,
  },
  Mutation: {
    setLiftStatus: (root, { id, status }) => {
      let updatedLift = lifts.find(
        (lift) => id === lift.id
      );
      updatedLift.status = status;
      return updatedLift;
    },
  },
  Trail: {
    liftAccess: trail =>
    lifts.filter(lift => lift.trails.includes(trail.id))
  },
  Lift: {
    trailAccess: lift =>
    lift.trails.map(id => ({__typename: "Trail", id}))
  }
};

async function startApolloServer() {
  const server = new ApolloServer({
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
  });
  const { url } = await startStandaloneServer(server, {
    listen: { port: process.env.PORT },
  });
  console.log(`🚡 Lift Server ready at ${url}`);
}

startApolloServer();
