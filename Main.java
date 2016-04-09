import java.io.PrintWriter;
import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.net.URL;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.DocumentBuilder;
import org.w3c.dom.Document;
import org.w3c.dom.NodeList;
import org.w3c.dom.Node;
import org.w3c.dom.Element;

public class Main {
	static int id=-1;
	static int numSpecies=0;
	static int numAreas=0;
	public static void main(String[] args) {
		PrintWriter out= null, out2=null;

		try {
			out = new PrintWriter(new BufferedWriter(new FileWriter("insertSpecies.sql", true)));
			out2 = new PrintWriter(new BufferedWriter(new FileWriter("insertAreas.sql", true)));
		} catch (IOException e) {
			e.printStackTrace();
		}

		genInserts("PLANTAS",out,out2);
		genInserts("INSETOS",out,out2);
		genInserts("ARANHAS",out,out2);
		genInserts("BIVALVES",out,out2);
		genInserts("GASTROPEDES",out,out2);
		genInserts("PEIXES",out,out2);
		genInserts("ANFIBIOS",out,out2);
		genInserts("REPTEIS",out,out2);
		genInserts("MAMIFEROS",out,out2);

		out.flush();
		out.close();
		out2.flush();
		out2.close();
		System.out.println("Done. #Species: "+numSpecies+" #Zonas: "+numAreas);
	}

	private static void genInserts(String api, PrintWriter fileSpecies, PrintWriter fileAreas){
		System.out.println(api+": Start");
		try {
			DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
			DocumentBuilder db = dbf.newDocumentBuilder();
			Document doc = null;
			if(api.equals("GASTROPEDES")){// eles trocaram um E por um O em alguns sitios.... wtf!!! => so hardcode
				api="GASTROPODES";
				doc = db.parse(new URL("http://www.igeo.pt/WFS/Natureza/GASTROPEDES?request=GetFeature&typeName=SERVICOS_00"+api+":"+api+"&srsname=urn:ogc:def:crs:EPSG:6.9:4326").openStream());
			}else doc = db.parse(new URL("http://www.igeo.pt/WFS/Natureza/"+api+"?request=GetFeature&typeName=SERVICOS_00"+api+":"+api+"&srsname=urn:ogc:def:crs:EPSG:6.9:4326").openStream());

			doc.getDocumentElement().normalize();


			NodeList nList = doc.getElementsByTagName("gml:featureMember");


			String especie = "", nome_vulgar="";

			for (int temp = 0; temp < nList.getLength(); temp++) {
				especie = "";
				nome_vulgar="";
				Node nNode = nList.item(temp);

				Node plantas = nNode.getFirstChild();

				//System.out.println("\nCurrent Element :" + nNode.getNodeName());

				if (nNode.getNodeType() == Node.ELEMENT_NODE) {
					/*
					INSERT INTO species (specieID, scientificName) VALUES (1, 'Teste');
					INSERT INTO locations (specieID,location) VALUES (1, ST_GeographyFromText('SRID=4326;POLYGON((0 0, 0 10, 10 10, 10 0, 0 0))') );
					 */
					Element eElement = (Element) plantas;
					System.out.println("FID: "+eElement.getElementsByTagName("SERVICOS_00"+api+":FID").item(0).getTextContent());
					especie = eElement.getElementsByTagName("SERVICOS_00"+api+":Especies").item(0).getTextContent();
					nome_vulgar = eElement.getElementsByTagName("SERVICOS_00"+api+":Nome_Vulga").item(0).getTextContent();
					id++;
					fileSpecies.println("INSERT INTO species (specieID, scientificName, nomevulgar) VALUES ("+id+",'"+especie+"','"+nome_vulgar+"');");
					numSpecies++;
					NodeList posLists = eElement.getElementsByTagName("gml:posList");
					for (int temp2 = 0; temp2 < posLists.getLength(); temp2++) {

						Node posList = posLists.item(temp2);
						Element ePosList = (Element) posList;
						StringBuilder posListFormated = new StringBuilder("");
						String[] pos = ePosList.getTextContent().split(" ");
						int count = 0;
						for(int pos_i=0; pos_i<pos.length;pos_i++){
							if(!pos[pos_i].equals("")){
								posListFormated.append(pos[pos_i]);
								if(count%2!=0){
									posListFormated.append(",");
								}
								if(pos_i!=pos.length-1)
									posListFormated.append(" ");
								count++;
							}
						}
						if(count%2!=0){
							System.err.println("ERRO AO FAZER PARSE DAS COORDENADAS");
							System.exit(-1);
						}
						if(posListFormated.charAt(posListFormated.length()-1)==','){
							posListFormated.deleteCharAt(posListFormated.length()-1);
						}
						fileAreas.println("INSERT INTO locations (specieID,location) VALUES ("+id+",ST_GeographyFromText('SRID=4326;POLYGON(("+posListFormated.toString()+"))') );");
						numAreas++;
					}	
				}
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
		System.out.println(api+": Done");
	}
}
