import { remote, types } from "../../shared";
import Session from "../session";

export default async function(session: Session, event: types.Location): Promise<string> {
  return session.connection.sendRequest(remote.client.giveText, event);
}
